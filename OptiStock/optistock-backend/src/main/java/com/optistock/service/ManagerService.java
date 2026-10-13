package com.optistock.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.optistock.dto.AlertsResponse;
import com.optistock.dto.DemandForecastResponse;
import com.optistock.dto.DemandForecastResponse.CalcDetails;
import com.optistock.dto.DemandForecastResponse.DailyForecastPoint;
import com.optistock.dto.DemandForecastResponse.DailyHistoryPoint;
import com.optistock.dto.DemandForecastResponse.ProductDemandForecast;
import com.optistock.dto.ExpiringDiscountedResponse;
import com.optistock.dto.ExpiringProductItem;
import com.optistock.dto.ForecastItem;
import com.optistock.dto.ParetoItem;
import com.optistock.dto.ParetoResponse;
import com.optistock.dto.PriceQuote;
import com.optistock.dto.ProductMixResponse;
import com.optistock.dto.RankingItem;
import com.optistock.dto.SummaryResponse;
import com.optistock.entity.BillStatus;
import com.optistock.entity.ExpiryStatus;
import com.optistock.entity.Product;
import com.optistock.exception.ResourceNotFoundException;
import com.optistock.repository.BillItemRepository;
import com.optistock.repository.BillRepository;
import com.optistock.repository.ProductRepository;
import com.optistock.repository.PurchaseOrderRepository;

@Service
@Transactional(readOnly = true)
public class ManagerService {

	private final ProductRepository productRepository;
	private final BillRepository billRepository;
	private final BillItemRepository billItemRepository;
	private final ExpiryPricingService expiryPricingService;
	private final PurchaseOrderRepository purchaseOrderRepository;
	private final java.time.Clock clock;

	@org.springframework.beans.factory.annotation.Autowired
	public ManagerService(ProductRepository productRepository, BillRepository billRepository,
			BillItemRepository billItemRepository, ExpiryPricingService expiryPricingService,
			PurchaseOrderRepository purchaseOrderRepository, java.time.Clock clock) {
		this.productRepository = productRepository;
		this.billRepository = billRepository;
		this.billItemRepository = billItemRepository;
		this.expiryPricingService = expiryPricingService;
		this.purchaseOrderRepository = purchaseOrderRepository;
		this.clock = clock != null ? clock : java.time.Clock.system(ZoneId.of("Asia/Kolkata"));
	}

	public ManagerService(ProductRepository productRepository, BillRepository billRepository,
			BillItemRepository billItemRepository, ExpiryPricingService expiryPricingService,
			PurchaseOrderRepository purchaseOrderRepository) {
		this(productRepository, billRepository, billItemRepository, expiryPricingService, purchaseOrderRepository,
				java.time.Clock.system(ZoneId.of("Asia/Kolkata")));
	}

	public ManagerService(ProductRepository productRepository, BillRepository billRepository,
			BillItemRepository billItemRepository, ExpiryPricingService expiryPricingService) {
		this(productRepository, billRepository, billItemRepository, expiryPricingService, null,
				java.time.Clock.system(ZoneId.of("Asia/Kolkata")));
	}

	public List<ForecastItem> getForecast() {
		LocalDate today = LocalDate.now(clock);
		LocalDateTime now = LocalDateTime.now(clock);
		LocalDateTime d7 = today.minusDays(7).atStartOfDay();
		LocalDateTime d30 = today.minusDays(30).atStartOfDay();

		Map<Long, Long> sales7 = toQuantityMap(billItemRepository.sumQuantityByProductBetween(d7, now));
		Map<Long, Long> sales23 = toQuantityMap(billItemRepository.sumQuantityByProductBetween(d30, d7));

		Map<Long, Integer> onOrderMap = getOnOrderMap();

		List<Product> products = productRepository.findByActiveTrue();
		List<ForecastItem> result = new ArrayList<>();

		for (Product p : products) {
			long s7 = sales7.getOrDefault(p.getId(), 0L);
			long s23 = sales23.getOrDefault(p.getId(), 0L);

			BigDecimal weightedSum = BigDecimal.valueOf(s7 * 2 + s23);
			BigDecimal avgDailySales = weightedSum.divide(BigDecimal.valueOf(37), 2, RoundingMode.HALF_UP);

			int forecast30 = (int) Math.ceil(avgDailySales.doubleValue() * 30);
			int stock = p.getStockQuantity() == null ? 0 : p.getStockQuantity();
			int onOrder = onOrderMap.getOrDefault(p.getId(), 0);

			BigDecimal daysOfCover;
			if (avgDailySales.compareTo(BigDecimal.ZERO) == 0) {
				daysOfCover = stock > 0 ? new BigDecimal("999.00") : BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
			} else {
				daysOfCover = BigDecimal.valueOf(stock).divide(avgDailySales, 2, RoundingMode.HALF_UP);
			}

			int target = (int) Math.ceil(forecast30 * 1.10);
			int suggestedReorderQty = Math.max(0, target - stock - onOrder);

			if (p.getExpiryDate() != null) {
				long daysLeft = ChronoUnit.DAYS.between(today, p.getExpiryDate());
				if (daysLeft <= 0) {
					suggestedReorderQty = 0;
				} else {
					int cap = (int) Math.floor(avgDailySales.doubleValue() * daysLeft);
					suggestedReorderQty = Math.min(suggestedReorderQty, Math.max(0, cap - onOrder));
				}
			}

			result.add(new ForecastItem(
					p.getId(),
					p.getName(),
					p.getBrand(),
					p.getCategory(),
					stock,
					avgDailySales,
					forecast30,
					daysOfCover,
					suggestedReorderQty,
					onOrder));
		}

		return result;
	}

	public List<ForecastItem> getReorder() {
		List<ForecastItem> forecast = getForecast();
		Map<Long, Integer> thresholdMap = productRepository.findByActiveTrue().stream()
				.collect(Collectors.toMap(Product::getId, p -> p.getReorderThreshold() == null ? 0 : p.getReorderThreshold()));

		return forecast.stream()
				.filter(item -> {
					int threshold = thresholdMap.getOrDefault(item.getProductId(), 0);
					boolean needsReorder = (item.getStock() + item.getOnOrderQuantity()) <= threshold
							|| item.getDaysOfCover().compareTo(BigDecimal.valueOf(7)) < 0;
					return needsReorder && item.getSuggestedReorderQty() > 0;
				})
				.sorted(Comparator.comparing(ForecastItem::getDaysOfCover))
				.collect(Collectors.toList());
	}

	public AlertsResponse getAlerts() {
		LocalDate today = LocalDate.now(clock);
		LocalDateTime now = LocalDateTime.now(clock);
		LocalDateTime d30 = today.minusDays(30).atStartOfDay();

		Map<Long, Long> sales30Map = toQuantityMap(billItemRepository.sumQuantityByProductBetween(d30, now));
		List<Product> products = productRepository.findByActiveTrue();

		List<AlertsResponse.LowStockItem> lowStock = new ArrayList<>();
		List<AlertsResponse.ExpiringSoonItem> expiringSoon = new ArrayList<>();
		List<AlertsResponse.MarkdownItem> markdownActive = new ArrayList<>();
		List<AlertsResponse.ExpiredItem> expired = new ArrayList<>();
		List<AlertsResponse.SlowMovingItem> slowMoving = new ArrayList<>();

		for (Product p : products) {
			int stock = p.getStockQuantity() == null ? 0 : p.getStockQuantity();
			int threshold = p.getReorderThreshold() == null ? 0 : p.getReorderThreshold();

			if (stock <= threshold) {
				lowStock.add(new AlertsResponse.LowStockItem(p.getId(), p.getName(), stock, threshold));
			}

			PriceQuote quote = expiryPricingService.quote(p, today);

			if (quote.getStatus() == ExpiryStatus.EXPIRING_SOON) {
				expiringSoon.add(new AlertsResponse.ExpiringSoonItem(p.getId(), p.getName(), quote.getDaysLeft(), p.getExpiryDate()));
			}

			if (quote.getStatus() == ExpiryStatus.MARKDOWN || quote.getStatus() == ExpiryStatus.LAST_DAY) {
				markdownActive.add(new AlertsResponse.MarkdownItem(
						p.getId(),
						p.getName(),
						quote.getDiscountPercent(),
						quote.getEffectivePrice(),
						quote.getDaysLeft(),
						quote.getStatus()));
			}

			if (quote.getStatus() == ExpiryStatus.EXPIRED && stock > 0) {
				expired.add(new AlertsResponse.ExpiredItem(p.getId(), p.getName(), stock, p.getExpiryDate()));
			}

			long sales30 = sales30Map.getOrDefault(p.getId(), 0L);
			if (stock > 0 && sales30 < (stock * 0.20)) {
				slowMoving.add(new AlertsResponse.SlowMovingItem(p.getId(), p.getName(), stock, sales30));
			}
		}

		return new AlertsResponse(lowStock, expiringSoon, markdownActive, expired, slowMoving);
	}

	public SummaryResponse getSummary(LocalDate from, LocalDate to) {
		LocalDate today = LocalDate.now(clock);
		if (from == null) {
			from = today;
		}
		if (to == null) {
			to = from;
		}

		LocalDateTime fromDt = from.atStartOfDay();
		LocalDateTime toDt = to.plusDays(1).atStartOfDay();

		long billCount = billRepository.countByDateRangeAndStatus(fromDt, toDt, BillStatus.COMPLETED);
		long itemsSold = billItemRepository.totalItemsSold(fromDt, toDt);
		BigDecimal grossSales = toBigDecimal(billItemRepository.totalGrossSales(fromDt, toDt));
		BigDecimal totalDiscountGiven = toBigDecimal(billItemRepository.totalDiscountGiven(fromDt, toDt));
		BigDecimal netSales = toBigDecimal(billRepository.sumTotalAmountByDateRangeAndStatus(fromDt, toDt, BillStatus.COMPLETED));

		long cancelledBillCount = billRepository.countByDateRangeAndStatus(fromDt, toDt, BillStatus.CANCELLED);
		BigDecimal cancelledAmount = toBigDecimal(billRepository.sumTotalAmountByDateRangeAndStatus(fromDt, toDt, BillStatus.CANCELLED));

		BigDecimal markdownSalesAmount = toBigDecimal(billItemRepository.markdownSalesAmount(fromDt, toDt));
		long belowCostItemCount = billItemRepository.belowCostItemCount(fromDt, toDt);

		List<SummaryResponse.DailyTotal> dailyTotals = new ArrayList<>();
		for (Object[] row : billRepository.dailyTotals(fromDt, toDt)) {
			LocalDate date;
			if (row[0] instanceof java.sql.Date) {
				date = ((java.sql.Date) row[0]).toLocalDate();
			} else if (row[0] instanceof LocalDate) {
				date = (LocalDate) row[0];
			} else {
				date = LocalDate.parse(row[0].toString().substring(0, 10));
			}
			long bills = ((Number) row[1]).longValue();
			BigDecimal dailyNet = toBigDecimal(row[2]);
			dailyTotals.add(new SummaryResponse.DailyTotal(date, bills, dailyNet));
		}

		List<SummaryResponse.TopProduct> top5 = new ArrayList<>();
		for (Object[] row : billItemRepository.top5Products(fromDt, toDt)) {
			String name = (String) row[0];
			long qtySold = ((Number) row[1]).longValue();
			BigDecimal revenue = toBigDecimal(row[2]);
			top5.add(new SummaryResponse.TopProduct(name, qtySold, revenue));
		}

		return new SummaryResponse(
				billCount,
				itemsSold,
				grossSales,
				totalDiscountGiven,
				netSales,
				cancelledBillCount,
				cancelledAmount,
				markdownSalesAmount,
				belowCostItemCount,
				dailyTotals,
				top5);
	}

	public List<RankingItem> getRanking(int days) {
		LocalDate today = LocalDate.now(clock);
		LocalDateTime toDt = LocalDateTime.now(clock);
		LocalDateTime fromDt = today.minusDays(days).atStartOfDay();

		List<Object[]> rows = billItemRepository.rankingByProfit(fromDt, toDt);
		List<RankingItem> ranking = new ArrayList<>();
		int rank = 1;

		for (Object[] row : rows) {
			Long productId = ((Number) row[0]).longValue();
			String name = (String) row[1];
			String brand = (String) row[2];
			String category = (String) row[3];
			long qtySold = ((Number) row[5]).longValue();
			BigDecimal revenue = toBigDecimal(row[6]);
			BigDecimal profit = toBigDecimal(row[7]);
			if (profit.compareTo(BigDecimal.ZERO) < 0) {
				profit = BigDecimal.ZERO;
			}

			BigDecimal marginPercent;
			if (revenue.compareTo(BigDecimal.ZERO) > 0) {
				marginPercent = profit.multiply(BigDecimal.valueOf(100)).divide(revenue, 2, RoundingMode.HALF_UP);
			} else {
				marginPercent = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
			}

			ranking.add(new RankingItem(rank++, productId, name, brand, category, qtySold, revenue, profit, marginPercent));
		}

		return ranking;
	}

	public List<ProductMixResponse> getProductMix(int days) {
		LocalDate today = LocalDate.now(clock);
		LocalDateTime now = LocalDateTime.now(clock);
		LocalDateTime toDt = now;
		LocalDateTime fromDt = today.minusDays(days).atStartOfDay();

		Map<Long, Integer> onOrderMap = getOnOrderMap();

		Map<Long, ProductSales> salesMap = new HashMap<>();
		for (Object[] row : billItemRepository.salesByProductBetween(fromDt, toDt)) {
			Long productId = ((Number) row[0]).longValue();
			long qty = ((Number) row[1]).longValue();
			BigDecimal revenue = toBigDecimal(row[2]);
			salesMap.put(productId, new ProductSales(qty, revenue));
		}

		List<Product> allProducts = productRepository.findByActiveTrue();
		Map<Long, Integer> forecastMap = computeForecast30Map(allProducts);

		// Group active products by trimmed, case-insensitive productType.
		Map<String, List<Product>> byProductType = new HashMap<>();
		for (Product p : allProducts) {
			String pType = p.getProductType();
			if (pType == null || pType.trim().isEmpty()) {
				continue;
			}
			byProductType.computeIfAbsent(pType.trim().toLowerCase(), k -> new ArrayList<>()).add(p);
		}

		List<ProductMixResponse> responses = new ArrayList<>();

		for (Map.Entry<String, List<Product>> entry : byProductType.entrySet()) {
			List<Product> products = entry.getValue();
			if (products.isEmpty()) {
				continue;
			}

			String displayProductType = products.get(0).getProductType().trim();
			String category = products.get(0).getCategory();

			int groupStock = (int) products.stream()
					.mapToLong(p -> p.getStockQuantity() == null ? 0 : p.getStockQuantity())
					.sum();

			int groupOnOrder = products.stream()
					.mapToInt(p -> onOrderMap.getOrDefault(p.getId(), 0))
					.sum();

			int groupForecast30 = products.stream()
					.mapToInt(p -> forecastMap.getOrDefault(p.getId(), 0))
					.sum();

			int groupNeed = Math.max(0, (int) Math.ceil(1.10 * groupForecast30) - groupStock - groupOnOrder);

			List<ProductMixResponse.ProductMixItem> scoredList = new ArrayList<>();
			for (Product p : products) {
				ProductSales ps = salesMap.getOrDefault(p.getId(), new ProductSales(0, BigDecimal.ZERO));
				BigDecimal costPrice = p.getCostPrice() != null ? p.getCostPrice() : BigDecimal.ZERO;
				BigDecimal profit = ps.revenue.subtract(costPrice.multiply(BigDecimal.valueOf(ps.qtySold))).setScale(2, RoundingMode.HALF_UP);
				if (profit.compareTo(BigDecimal.ZERO) < 0) {
					profit = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
				}

				BigDecimal profitPerUnit;
				if (ps.qtySold > 0) {
					profitPerUnit = profit.divide(BigDecimal.valueOf(ps.qtySold), 2, RoundingMode.HALF_UP);
				} else if (p.getSellingPrice() != null) {
					profitPerUnit = p.getSellingPrice().subtract(costPrice).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
				} else {
					profitPerUnit = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
				}

				BigDecimal marginPercent;
				if (ps.revenue.compareTo(BigDecimal.ZERO) > 0) {
					marginPercent = profit.multiply(BigDecimal.valueOf(100)).divide(ps.revenue, 2, RoundingMode.HALF_UP);
				} else if (p.getSellingPrice() != null && p.getSellingPrice().compareTo(BigDecimal.ZERO) > 0) {
					BigDecimal unitMargin = p.getSellingPrice().subtract(costPrice).max(BigDecimal.ZERO);
					marginPercent = unitMargin.multiply(BigDecimal.valueOf(100)).divide(p.getSellingPrice(), 2, RoundingMode.HALF_UP);
				} else {
					marginPercent = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
				}

				int stock = p.getStockQuantity() == null ? 0 : p.getStockQuantity();
				int onOrder = onOrderMap.getOrDefault(p.getId(), 0);

				BigDecimal currentShare;
				if (groupStock > 0) {
					currentShare = BigDecimal.valueOf(stock).multiply(BigDecimal.valueOf(100))
							.divide(BigDecimal.valueOf(groupStock), 2, RoundingMode.HALF_UP);
				} else {
					currentShare = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
				}

				scoredList.add(new ProductMixResponse.ProductMixItem(
						p.getId(),
						p.getName(),
						p.getBrand() != null ? p.getBrand() : p.getName(),
						ps.qtySold,
						profit,
						profitPerUnit,
						marginPercent,
						currentShare,
						BigDecimal.ZERO,
						0,
						0,
						stock,
						onOrder));
			}

			// Sort brands: When two brands sold equal units, profit per unit decides the winner;
			// when units differ, total profit decides. Ties: higher margin percent first, then brand name.
			scoredList.sort((a, b) -> {
				if (a.getUnitsSold() == b.getUnitsSold()) {
					int cmpUnit = b.getProfitPerUnit().compareTo(a.getProfitPerUnit());
					if (cmpUnit != 0) return cmpUnit;
				} else {
					int cmpTotal = b.getProfit().compareTo(a.getProfit());
					if (cmpTotal != 0) return cmpTotal;
				}
				int cmpMargin = b.getMarginPercent().compareTo(a.getMarginPercent());
				if (cmpMargin != 0) return cmpMargin;
				return a.getBrand().compareToIgnoreCase(b.getBrand());
			});

			long distinctBrandCount = products.stream()
					.map(p -> p.getBrand() != null ? p.getBrand().trim() : "")
					.filter(b -> !b.isEmpty())
					.distinct()
					.count();

			String recommendation;
			String sentence;
			if (distinctBrandCount < 2) {
				recommendation = "Only one brand, nothing to compare";
				sentence = "Only one brand, nothing to compare";
				for (ProductMixResponse.ProductMixItem item : scoredList) {
					item.setSuggestedSharePercent(new BigDecimal("100.00"));
					item.setUnitsToOrder(groupNeed);
				}
			} else {
				ProductMixResponse.ProductMixItem winner = scoredList.get(0);
				winner.setSuggestedSharePercent(new BigDecimal("80.00"));

				List<ProductMixResponse.ProductMixItem> others = scoredList.subList(1, scoredList.size());
				BigDecimal otherProfitSum = others.stream()
						.map(ProductMixResponse.ProductMixItem::getProfit)
						.reduce(BigDecimal.ZERO, BigDecimal::add);

				if (otherProfitSum.compareTo(BigDecimal.ZERO) > 0) {
					for (ProductMixResponse.ProductMixItem item : others) {
						BigDecimal share = item.getProfit().multiply(new BigDecimal("20.00"))
								.divide(otherProfitSum, 2, RoundingMode.HALF_UP);
						item.setSuggestedSharePercent(share);
					}
				} else {
					BigDecimal equalShare = new BigDecimal("20.00")
							.divide(BigDecimal.valueOf(others.size()), 2, RoundingMode.HALF_UP);
					for (ProductMixResponse.ProductMixItem item : others) {
						item.setSuggestedSharePercent(equalShare);
					}
				}

				ProductMixResponse.ProductMixItem runnerUp = scoredList.get(1);
				boolean sameSales = winner.getUnitsSold() == runnerUp.getUnitsSold();
				String reason = sameSales ? "earned more profit on the same sales." : "earned more profit.";

				if (others.size() == 1) {
					recommendation = "Keep 80% " + winner.getBrand() + " and 20% " + runnerUp.getBrand()
							+ " because " + winner.getBrand() + " earned more profit.";
				} else {
					recommendation = "Order 80% of " + displayProductType + " from " + winner.getBrand()
							+ " and distribute 20% among alternatives because " + winner.getBrand() + " earned more profit.";
				}

				if (groupNeed == 0) {
					sentence = "No order needed now";
					for (ProductMixResponse.ProductMixItem item : scoredList) {
						item.setUnitsToOrder(0);
					}
				} else {
					if (others.size() == 1) {
						sentence = "Order 80% of " + displayProductType + " from " + winner.getBrand()
								+ " and 20% from " + runnerUp.getBrand()
								+ " because " + winner.getBrand() + " " + reason;
					} else {
						sentence = "Order 80% of " + displayProductType + " from " + winner.getBrand()
								+ " and distribute 20% among alternatives because " + winner.getBrand() + " " + reason;
					}

					// Split groupNeed: Round whole units for others, remainder to winner
					int otherAllocatedSum = 0;
					for (ProductMixResponse.ProductMixItem item : others) {
						int alloc = (int) Math.round(groupNeed * (item.getSuggestedSharePercent().doubleValue() / 100.0));
						item.setUnitsToOrder(alloc);
						otherAllocatedSum += alloc;
					}
					winner.setUnitsToOrder(Math.max(0, groupNeed - otherAllocatedSum));
				}
			}

			responses.add(new ProductMixResponse(
					displayProductType,
					category,
					days,
					groupForecast30,
					groupStock,
					groupOnOrder,
					groupNeed,
					recommendation,
					sentence,
					scoredList));
		}

		return responses;
	}

	public DemandForecastResponse getDemandForecast(int horizonDays, String categoryFilter, String productTypeFilter) {
		LocalDate today = LocalDate.now(clock);
		LocalDateTime now = LocalDateTime.now(clock);
		LocalDateTime historyStart = today.minusDays(35).atStartOfDay();

		List<Product> products = productRepository.findByActiveTrue();
		if (categoryFilter != null && !categoryFilter.isBlank() && !categoryFilter.equalsIgnoreCase("ALL")) {
			products = products.stream()
					.filter(p -> p.getCategory() != null && p.getCategory().equalsIgnoreCase(categoryFilter.trim()))
					.collect(Collectors.toList());
		}
		if (productTypeFilter != null && !productTypeFilter.isBlank() && !productTypeFilter.equalsIgnoreCase("ALL")) {
			products = products.stream()
					.filter(p -> p.getProductType() != null && p.getProductType().equalsIgnoreCase(productTypeFilter.trim()))
					.collect(Collectors.toList());
		}

		Map<Long, Map<LocalDate, Long>> dailyMap = loadDailyUnitsMap(historyStart, now);
		Map<Long, Integer> onOrderMap = getOnOrderMap();

		List<ProductDemandForecast> items = new ArrayList<>();
		int productsAtRisk = 0;
		int totalForecastUnits = 0;
		int productsNeedingReorder = 0;
		double totalErrorSum = 0.0;
		double totalActualSum = 0.0;
		int backtestProductCount = 0;

		for (Product p : products) {
			ProductDemandForecast item = calculateProductForecast(p, horizonDays, today, dailyMap.getOrDefault(p.getId(), Collections.emptyMap()), onOrderMap.getOrDefault(p.getId(), 0));
			items.add(item);

			if (item.getPredictedStockOutDate() != null && !item.getPredictedStockOutDate().isAfter(today.plusDays(7))) {
				productsAtRisk++;
			}
			totalForecastUnits += item.getForecastTotal();
			if (item.getSuggestedOrder() > 0) {
				productsNeedingReorder++;
			}

			if (item.getCalcDetails() != null && !"not enough data".equals(item.getBacktestError())) {
				try {
					String errStr = item.getBacktestError().replace("%", "").trim();
					double errVal = Double.parseDouble(errStr);
					totalErrorSum += errVal;
					totalActualSum += 1.0;
					backtestProductCount++;
				} catch (Exception ignored) {
				}
			}
		}

		// Sort items by stock-out risk (soonest stock-out first, then lowest days of cover)
		items.sort((a, b) -> {
			if (a.getPredictedStockOutDate() != null && b.getPredictedStockOutDate() != null) {
				return a.getPredictedStockOutDate().compareTo(b.getPredictedStockOutDate());
			}
			if (a.getPredictedStockOutDate() != null) return -1;
			if (b.getPredictedStockOutDate() != null) return 1;
			return a.getDaysOfCover().compareTo(b.getDaysOfCover());
		});

		String overallAccuracy = "not enough data";
		if (backtestProductCount > 0 && totalActualSum > 0) {
			double avgError = totalErrorSum / totalActualSum;
			double acc = Math.max(0.0, 100.0 - avgError);
			overallAccuracy = String.format("%.1f%%", acc);
		}

		return new DemandForecastResponse(productsAtRisk, totalForecastUnits, overallAccuracy, productsNeedingReorder, items);
	}

	public ProductDemandForecast getProductDemandForecast(Long productId, int horizonDays) {
		LocalDate today = LocalDate.now(clock);
		LocalDateTime now = LocalDateTime.now(clock);
		LocalDateTime historyStart = today.minusDays(35).atStartOfDay();

		Product p = productRepository.findByIdAndActiveTrue(productId)
				.orElseThrow(() -> new ResourceNotFoundException("Product " + productId + " not found"));

		Map<Long, Map<LocalDate, Long>> dailyMap = loadDailyUnitsMap(historyStart, now);
		Map<Long, Integer> onOrderMap = getOnOrderMap();

		return calculateProductForecast(p, horizonDays, today, dailyMap.getOrDefault(p.getId(), Collections.emptyMap()), onOrderMap.getOrDefault(p.getId(), 0));
	}

	private ProductDemandForecast calculateProductForecast(Product p, int horizonDays, LocalDate today, Map<LocalDate, Long> productDailyMap, int onOrder) {
		// 1. Daily units over last 30 completed days (today - 30 to today - 1)
		long[] last30Units = new long[30];
		long weightedSum = 0;
		double sumUnits = 0;

		List<DailyHistoryPoint> history30 = new ArrayList<>();
		for (int i = 0; i < 30; i++) {
			LocalDate d = today.minusDays(30 - i);
			long units = productDailyMap.getOrDefault(d, 0L);
			last30Units[i] = units;
			sumUnits += units;
			// Last 7 days (index 23 to 29) weight 2, earlier (0 to 22) weight 1
			int weight = (i >= 23) ? 2 : 1;
			weightedSum += units * weight;
			history30.add(new DailyHistoryPoint(d.toString(), units));
		}

		// Baseline A = weightedSum / 37
		BigDecimal baselineA = BigDecimal.valueOf(weightedSum)
				.divide(BigDecimal.valueOf(37), 2, RoundingMode.HALF_UP);

		// 2. Weekday factors over last 28 days
		long[] weekdaySum = new long[7]; // 0=MON .. 6=SUN
		long total28Units = 0;
		for (int i = 2; i < 30; i++) { // last 28 days of the 30
			LocalDate d = today.minusDays(30 - i);
			long units = productDailyMap.getOrDefault(d, 0L);
			int dowIdx = d.getDayOfWeek().getValue() - 1;
			weekdaySum[dowIdx] += units;
			total28Units += units;
		}

		double overallDailyAvg28 = total28Units / 28.0;

		// Check product history: count days since first registered sale in the map
		boolean hasShortHistory = productDailyMap.isEmpty() || total28Units == 0;
		Map<String, BigDecimal> weekdayFactors = new HashMap<>();

		for (DayOfWeek dow : DayOfWeek.values()) {
			int dowIdx = dow.getValue() - 1;
			double dowAvg = weekdaySum[dowIdx] / 4.0;
			double factor = 1.0;
			if (!hasShortHistory && overallDailyAvg28 > 0) {
				factor = dowAvg / overallDailyAvg28;
				factor = Math.min(1.5, Math.max(0.5, factor));
			}
			weekdayFactors.put(dow.name(), BigDecimal.valueOf(factor).setScale(2, RoundingMode.HALF_UP));
		}

		// 3. Standard deviation of last 30 daily values
		double mean30 = sumUnits / 30.0;
		double varianceSum = 0;
		for (long u : last30Units) {
			varianceSum += Math.pow(u - mean30, 2);
		}
		double sd = Math.sqrt(varianceSum / 30.0);
		BigDecimal standardDeviation = BigDecimal.valueOf(sd).setScale(2, RoundingMode.HALF_UP);

		// 4. Daily forecast for each future day
		List<DailyForecastPoint> dailyForecastList = new ArrayList<>();
		int horizonForecastTotal = 0;
		int forecast30Total = 0;

		int stock = p.getStockQuantity() != null ? p.getStockQuantity() : 0;
		LocalDate predictedStockOutDate = (stock == 0) ? today : null;
		double cumulativeForecast = 0;

		for (int k = 1; k <= Math.max(30, horizonDays); k++) {
			LocalDate futureDate = today.plusDays(k);
			DayOfWeek dow = futureDate.getDayOfWeek();
			BigDecimal factor = weekdayFactors.getOrDefault(dow.name(), BigDecimal.ONE);
			BigDecimal dayForecast = baselineA.multiply(factor).setScale(2, RoundingMode.HALF_UP);

			if (k <= horizonDays) {
				BigDecimal lower = dayForecast.subtract(standardDeviation).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
				BigDecimal upper = dayForecast.add(standardDeviation).setScale(2, RoundingMode.HALF_UP);
				dailyForecastList.add(new DailyForecastPoint(futureDate.toString(), dow.name(), dayForecast, lower, upper));
				horizonForecastTotal += (int) Math.round(dayForecast.doubleValue());

				cumulativeForecast += dayForecast.doubleValue();
				if (predictedStockOutDate == null && cumulativeForecast >= stock) {
					predictedStockOutDate = futureDate;
				}
			}

			if (k <= 30) {
				forecast30Total += (int) Math.round(dayForecast.doubleValue());
			}
		}

		// 5. Days of cover
		BigDecimal daysOfCover;
		if (baselineA.compareTo(BigDecimal.ZERO) == 0) {
			daysOfCover = stock > 0 ? new BigDecimal("999.00") : BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
		} else {
			daysOfCover = BigDecimal.valueOf(stock).divide(baselineA, 2, RoundingMode.HALF_UP);
		}

		// 6. Suggested order = max(0, ceil(1.10 x 30 day forecast) - stock - on order)
		int target30 = (int) Math.ceil(1.10 * forecast30Total);
		int suggestedOrder = Math.max(0, target30 - stock - onOrder);

		Long daysLeft = null;
		Integer expiryCap = null;
		if (p.getExpiryDate() != null) {
			daysLeft = ChronoUnit.DAYS.between(today, p.getExpiryDate());
			if (daysLeft <= 0) {
				suggestedOrder = 0;
				expiryCap = 0;
			} else {
				expiryCap = (int) Math.floor(baselineA.doubleValue() * daysLeft);
				suggestedOrder = Math.min(suggestedOrder, Math.max(0, expiryCap - onOrder));
			}
		}

		// 7. Trend: current period vs previous period of same length
		int n = horizonDays;
		long currPeriodUnits = 0;
		long prevPeriodUnits = 0;
		for (int i = 1; i <= n; i++) {
			currPeriodUnits += productDailyMap.getOrDefault(today.minusDays(i), 0L);
			prevPeriodUnits += productDailyMap.getOrDefault(today.minusDays(n + i), 0L);
		}
		BigDecimal trendPercent;
		if (prevPeriodUnits == 0) {
			trendPercent = currPeriodUnits > 0 ? new BigDecimal("100.00") : BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
		} else {
			double diff = (double) (currPeriodUnits - prevPeriodUnits);
			trendPercent = BigDecimal.valueOf((diff / prevPeriodUnits) * 100.0).setScale(2, RoundingMode.HALF_UP);
		}

		// 8. Accuracy / Backtest over last 7 days
		String backtestError;
		if (total28Units == 0 || hasShortHistory) {
			backtestError = "not enough data";
		} else {
			double backtestErrorSum = 0;
			double backtestActualSum = 0;
			for (int d = 1; d <= 7; d++) {
				LocalDate targetDate = today.minusDays(8 - d);
				long actual = productDailyMap.getOrDefault(targetDate, 0L);
				// Simulate forecast using data strictly before targetDate
				BigDecimal pred = baselineA.multiply(weekdayFactors.getOrDefault(targetDate.getDayOfWeek().name(), BigDecimal.ONE));
				backtestErrorSum += Math.abs(pred.doubleValue() - actual);
				backtestActualSum += actual;
			}
			if (backtestActualSum == 0) {
				backtestError = (backtestErrorSum == 0) ? "0.0%" : "not enough data";
			} else {
				double wape = (backtestErrorSum / backtestActualSum) * 100.0;
				backtestError = String.format("%.1f%%", wape);
			}
		}

		CalcDetails calcDetails = new CalcDetails();
		calcDetails.setBaselineA(baselineA);
		calcDetails.setWeekdayFactors(weekdayFactors);
		calcDetails.setStandardDeviation(standardDeviation);
		calcDetails.setStock(stock);
		calcDetails.setOnOrder(onOrder);
		calcDetails.setForecast30(forecast30Total);
		calcDetails.setTarget30(target30);
		calcDetails.setSuggestedOrder(suggestedOrder);
		calcDetails.setDaysLeft(daysLeft);
		calcDetails.setExpiryCap(expiryCap);

		ProductDemandForecast forecast = new ProductDemandForecast();
		forecast.setId(p.getId());
		forecast.setName(p.getName());
		forecast.setBrand(p.getBrand());
		forecast.setCategory(p.getCategory());
		forecast.setProductType(p.getProductType());
		forecast.setStock(stock);
		forecast.setOnOrder(onOrder);
		forecast.setAvgDaily(baselineA);
		forecast.setForecastTotal(horizonForecastTotal);
		forecast.setDailyForecast(dailyForecastList);
		forecast.setHistory30(history30);
		forecast.setDaysOfCover(daysOfCover);
		forecast.setPredictedStockOutDate(predictedStockOutDate);
		forecast.setTrendPercent(trendPercent);
		forecast.setSuggestedOrder(suggestedOrder);
		forecast.setBacktestError(backtestError);
		forecast.setCalcDetails(calcDetails);

		return forecast;
	}

	private Map<Long, Map<LocalDate, Long>> loadDailyUnitsMap(LocalDateTime from, LocalDateTime to) {
		Map<Long, Map<LocalDate, Long>> map = new HashMap<>();
		for (Object[] row : billItemRepository.dailyUnitsByProductBetween(from, to)) {
			Long productId = ((Number) row[0]).longValue();
			LocalDate date;
			if (row[1] instanceof java.sql.Date) {
				date = ((java.sql.Date) row[1]).toLocalDate();
			} else if (row[1] instanceof LocalDate) {
				date = (LocalDate) row[1];
			} else {
				date = LocalDate.parse(row[1].toString().substring(0, 10));
			}
			Long qty = ((Number) row[2]).longValue();
			map.computeIfAbsent(productId, k -> new HashMap<>()).put(date, qty);
		}
		return map;
	}

	private Map<Long, Integer> getOnOrderMap() {
		Map<Long, Integer> map = new HashMap<>();
		if (purchaseOrderRepository != null) {
			for (Object[] row : purchaseOrderRepository.sumOrderedQuantityGroupByProductId()) {
				Long pid = ((Number) row[0]).longValue();
				int qty = ((Number) row[1]).intValue();
				map.put(pid, qty);
			}
		}
		return map;
	}

	private Map<Long, Integer> computeForecast30Map(List<Product> products) {
		LocalDate today = LocalDate.now(clock);
		LocalDateTime now = LocalDateTime.now(clock);
		LocalDateTime d7 = today.minusDays(7).atStartOfDay();
		LocalDateTime d30 = today.minusDays(30).atStartOfDay();

		Map<Long, Long> sales7 = toQuantityMap(billItemRepository.sumQuantityByProductBetween(d7, now));
		Map<Long, Long> sales23 = toQuantityMap(billItemRepository.sumQuantityByProductBetween(d30, d7));

		Map<Long, Integer> forecastMap = new HashMap<>();
		for (Product p : products) {
			long s7 = sales7.getOrDefault(p.getId(), 0L);
			long s23 = sales23.getOrDefault(p.getId(), 0L);
			BigDecimal weightedSum = BigDecimal.valueOf(s7 * 2 + s23);
			BigDecimal avgDaily = weightedSum.divide(BigDecimal.valueOf(37), 2, RoundingMode.HALF_UP);
			int forecast30 = (int) Math.ceil(avgDaily.doubleValue() * 30);
			forecastMap.put(p.getId(), forecast30);
		}
		return forecastMap;
	}

	@Transactional(readOnly = true)
	public ParetoResponse getParetoAnalysis(int days) {
		LocalDate today = LocalDate.now(clock);
		LocalDateTime toDt = LocalDateTime.now(clock);
		LocalDateTime fromDt = today.minusDays(days).atStartOfDay();

		List<Object[]> rows = billItemRepository.rankingByProfit(fromDt, toDt);
		List<Product> allProducts = productRepository.findByActiveTrue();
		Map<Long, Product> productMap = allProducts.stream().collect(Collectors.toMap(Product::getId, p -> p, (a, b) -> a));

		List<ParetoItem> items = new ArrayList<>();
		BigDecimal totalProfit = BigDecimal.ZERO;
		java.util.Set<Long> seenProductIds = new java.util.HashSet<>();

		for (Object[] row : rows) {
			Long productId = ((Number) row[0]).longValue();
			seenProductIds.add(productId);
			String name = (String) row[1];
			String brand = (String) row[2];
			String category = (String) row[3];
			int stock = ((Number) row[4]).intValue();
			long qtySold = ((Number) row[5]).longValue();
			BigDecimal revenue = toBigDecimal(row[6]);
			BigDecimal profit = toBigDecimal(row[7]);
			if (profit.compareTo(BigDecimal.ZERO) < 0) {
				profit = BigDecimal.ZERO;
			}
			totalProfit = totalProfit.add(profit);

			Product p = productMap.get(productId);
			int reorderThresh = (p != null && p.getReorderThreshold() != null) ? p.getReorderThreshold() : 10;

			BigDecimal marginPercent;
			if (revenue.compareTo(BigDecimal.ZERO) > 0) {
				marginPercent = profit.multiply(BigDecimal.valueOf(100)).divide(revenue, 2, RoundingMode.HALF_UP);
			} else {
				marginPercent = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
			}

			items.add(new ParetoItem(productId, name, brand, category, stock, reorderThresh, qtySold, revenue, profit, marginPercent));
		}

		for (Product p : allProducts) {
			if (!seenProductIds.contains(p.getId())) {
				int stock = p.getStockQuantity() != null ? p.getStockQuantity() : 0;
				int reorderThresh = p.getReorderThreshold() != null ? p.getReorderThreshold() : 10;
				items.add(new ParetoItem(p.getId(), p.getName(), p.getBrand(), p.getCategory(), stock, reorderThresh,
						0, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO));
			}
		}

		items.sort((a, b) -> b.getProfit().compareTo(a.getProfit()));

		BigDecimal runningProfit = BigDecimal.ZERO;
		int countA = 0, countB = 0, countC = 0;
		int totalCount = items.size();

		for (ParetoItem item : items) {
			runningProfit = runningProfit.add(item.getProfit());
			BigDecimal cumPct;
			if (totalProfit.compareTo(BigDecimal.ZERO) > 0) {
				cumPct = runningProfit.multiply(BigDecimal.valueOf(100)).divide(totalProfit, 2, RoundingMode.HALF_UP);
			} else {
				cumPct = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
			}
			item.setCumulativeProfitPercent(cumPct);

			if (totalProfit.compareTo(BigDecimal.ZERO) == 0) {
				item.setClassification("C");
				item.setRecommendation("Maintain minimum buffer stock");
				countC++;
			} else if (cumPct.compareTo(BigDecimal.valueOf(80)) <= 0) {
				item.setClassification("A");
				item.setRecommendation("Keep 80% stock buffer; never run out");
				countA++;
			} else if (cumPct.compareTo(BigDecimal.valueOf(95)) <= 0) {
				item.setClassification("B");
				item.setRecommendation("Standard reorder on threshold breach");
				countB++;
			} else {
				item.setClassification("C");
				item.setRecommendation("Maintain minimum buffer stock; review margins");
				countC++;
			}
		}

		ParetoResponse res = new ParetoResponse();
		res.setTotalRevenue(items.stream().map(ParetoItem::getRevenue).reduce(BigDecimal.ZERO, BigDecimal::add));
		res.setTotalProfit(totalProfit);
		res.setClassACount(countA);
		res.setClassBCount(countB);
		res.setClassCCount(countC);
		res.setItems(items);

		String pctA = totalCount > 0 ? String.format("%.0f", (countA * 100.0 / totalCount)) : "0";
		res.setSmartRecommendation("Smart Mix Strategy: Allocate ~80% of stock budget to Class A fast movers (" + countA 
				+ " products driving " + pctA + "% of profit) and ~20% to Class B/C items.");
		return res;
	}

	@Transactional(readOnly = true)
	public ExpiringDiscountedResponse getExpiringDiscounted(int daysBeforeExpiry) {
		LocalDate today = LocalDate.now(clock);
		LocalDate cutoff = today.plusDays(daysBeforeExpiry);

		List<Product> products = productRepository.findByActiveTrue();
		List<ExpiringProductItem> items = new ArrayList<>();
		int expiringCount = 0;
		int liveDiscounted = 0;
		BigDecimal totalRisk = BigDecimal.ZERO;

		for (Product p : products) {
			PriceQuote quote = expiryPricingService.quote(p, today);
			boolean isNearExpiry = p.getExpiryDate() != null && !p.getExpiryDate().isAfter(cutoff);
			boolean hasDiscount = quote.getDiscountPercent().compareTo(BigDecimal.ZERO) > 0;
			boolean isAlertOrMarkdown = quote.getStatus() == ExpiryStatus.EXPIRING_SOON
					|| quote.getStatus() == ExpiryStatus.MARKDOWN
					|| quote.getStatus() == ExpiryStatus.LAST_DAY
					|| quote.getStatus() == ExpiryStatus.EXPIRED;

			if (isNearExpiry || hasDiscount || isAlertOrMarkdown) {
				long daysLeft = quote.getDaysLeft();
				BigDecimal cost = p.getCostPrice() != null ? p.getCostPrice() : BigDecimal.ZERO;
				BigDecimal orig = quote.getBasePrice();
				int stock = p.getStockQuantity() != null ? p.getStockQuantity() : 0;

				BigDecimal currentDiscount = quote.getDiscountPercent();
				BigDecimal discountedPrice = quote.getEffectivePrice();
				BigDecimal risk = cost.multiply(BigDecimal.valueOf(stock)).setScale(2, RoundingMode.HALF_UP);

				ExpiringProductItem item = new ExpiringProductItem();
				item.setId(p.getId());
				item.setName(p.getName());
				item.setCategory(p.getCategory());
				item.setBrand(p.getBrand());
				item.setBatchNumber(p.getBatchNumber());
				item.setExpiryDate(p.getExpiryDate());
				item.setDaysLeft(daysLeft);
				item.setStockQuantity(stock);
				item.setCostPrice(cost);
				item.setOriginalPrice(orig);
				item.setDiscountPercent(currentDiscount);
				item.setDiscountedPrice(discountedPrice);
				item.setSuggestedDiscount(currentDiscount);
				item.setRiskValue(risk);

				items.add(item);

				if (isNearExpiry && stock > 0) expiringCount++;
				if (hasDiscount && stock > 0) liveDiscounted++;
				if (stock > 0) totalRisk = totalRisk.add(risk);
			}
		}

		// Sort by days left ascending, then stock descending
		items.sort(Comparator.comparingLong(ExpiringProductItem::getDaysLeft)
				.thenComparing((a, b) -> Integer.compare(b.getStockQuantity(), a.getStockQuantity())));

		ExpiringDiscountedResponse res = new ExpiringDiscountedResponse();
		res.setItems(items);
		res.setExpiringSoonCount(expiringCount);
		res.setDiscountedLiveCount(liveDiscounted);
		res.setTotalRiskValue(totalRisk);
		res.setDaysBeforeExpirySetting(daysBeforeExpiry);
		return res;
	}

	@Transactional
	public void updateProductDiscount(Long productId, BigDecimal discountPercent) {
		Product p = productRepository.findById(productId)
				.orElseThrow(() -> new ResourceNotFoundException("Product " + productId + " not found"));
		p.setDiscountPercent(discountPercent != null && discountPercent.compareTo(BigDecimal.ZERO) >= 0 ? discountPercent : BigDecimal.ZERO);
		productRepository.save(p);
	}

	@Transactional
	public void clearProductStock(Long productId) {
		Product p = productRepository.findById(productId)
				.orElseThrow(() -> new ResourceNotFoundException("Product " + productId + " not found"));
		p.setStockQuantity(0);
		productRepository.save(p);
	}

	private Map<Long, Long> toQuantityMap(List<Object[]> rows) {
		Map<Long, Long> map = new HashMap<>();
		for (Object[] r : rows) {
			Long id = ((Number) r[0]).longValue();
			Long qty = ((Number) r[1]).longValue();
			map.put(id, qty);
		}
		return map;
	}

	private BigDecimal toBigDecimal(Object val) {
		if (val == null) {
			return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
		}
		if (val instanceof BigDecimal) {
			return ((BigDecimal) val).setScale(2, RoundingMode.HALF_UP);
		}
		return new BigDecimal(val.toString()).setScale(2, RoundingMode.HALF_UP);
	}

	private static class ProductSales {
		long qtySold;
		BigDecimal revenue;

		ProductSales(long qtySold, BigDecimal revenue) {
			this.qtySold = qtySold;
			this.revenue = revenue;
		}
	}
}
