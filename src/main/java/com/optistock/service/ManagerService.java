package com.optistock.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.optistock.dto.AlertsResponse;
import com.optistock.dto.ForecastItem;
import com.optistock.dto.ProductMixResponse;
import com.optistock.dto.RankingItem;
import com.optistock.dto.SummaryResponse;
import com.optistock.dto.ParetoItem;
import com.optistock.dto.ParetoResponse;
import com.optistock.dto.ExpiringProductItem;
import com.optistock.dto.ExpiringDiscountedResponse;
import com.optistock.dto.PriceQuote;
import com.optistock.exception.ResourceNotFoundException;
import com.optistock.entity.BillStatus;
import com.optistock.entity.ExpiryStatus;
import com.optistock.entity.Product;
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

	@org.springframework.beans.factory.annotation.Autowired
	public ManagerService(ProductRepository productRepository, BillRepository billRepository,
			BillItemRepository billItemRepository, ExpiryPricingService expiryPricingService,
			PurchaseOrderRepository purchaseOrderRepository) {
		this.productRepository = productRepository;
		this.billRepository = billRepository;
		this.billItemRepository = billItemRepository;
		this.expiryPricingService = expiryPricingService;
		this.purchaseOrderRepository = purchaseOrderRepository;
	}

	public ManagerService(ProductRepository productRepository, BillRepository billRepository,
			BillItemRepository billItemRepository, ExpiryPricingService expiryPricingService) {
		this(productRepository, billRepository, billItemRepository, expiryPricingService, null);
	}

	public List<ForecastItem> getForecast() {
		LocalDate today = LocalDate.now(ZoneId.of("Asia/Kolkata"));
		LocalDateTime now = LocalDateTime.now(ZoneId.of("Asia/Kolkata"));
		LocalDateTime d7 = today.minusDays(7).atStartOfDay();
		LocalDateTime d30 = today.minusDays(30).atStartOfDay();

		Map<Long, Long> sales7 = toQuantityMap(billItemRepository.sumQuantityByProductBetween(d7, now));
		Map<Long, Long> sales23 = toQuantityMap(billItemRepository.sumQuantityByProductBetween(d30, d7));

		Map<Long, Integer> onOrderMap = new HashMap<>();
		if (purchaseOrderRepository != null) {
			for (Object[] row : purchaseOrderRepository.sumOrderedQuantityGroupByProductId()) {
				Long pid = ((Number) row[0]).longValue();
				int qty = ((Number) row[1]).intValue();
				onOrderMap.put(pid, qty);
			}
		}

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
		LocalDate today = LocalDate.now(ZoneId.of("Asia/Kolkata"));
		LocalDateTime now = LocalDateTime.now(ZoneId.of("Asia/Kolkata"));
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
		LocalDate today = LocalDate.now(ZoneId.of("Asia/Kolkata"));
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
				date = LocalDate.parse(row[0].toString());
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
		LocalDateTime toDt = LocalDateTime.now(ZoneId.of("Asia/Kolkata"));
		LocalDateTime fromDt = LocalDate.now(ZoneId.of("Asia/Kolkata")).minusDays(days).atStartOfDay();

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
		LocalDate today = LocalDate.now(ZoneId.of("Asia/Kolkata"));
		LocalDateTime now = LocalDateTime.now(ZoneId.of("Asia/Kolkata"));
		LocalDateTime toDt = now;
		LocalDateTime fromDt = today.minusDays(days).atStartOfDay();

		LocalDateTime d7 = today.minusDays(7).atStartOfDay();
		LocalDateTime d30 = today.minusDays(30).atStartOfDay();

		Map<Long, Long> sales7 = toQuantityMap(billItemRepository.sumQuantityByProductBetween(d7, now));
		Map<Long, Long> sales23 = toQuantityMap(billItemRepository.sumQuantityByProductBetween(d30, d7));

		Map<Long, Integer> onOrderMap = new HashMap<>();
		if (purchaseOrderRepository != null) {
			for (Object[] row : purchaseOrderRepository.sumOrderedQuantityGroupByProductId()) {
				Long pid = ((Number) row[0]).longValue();
				int qty = ((Number) row[1]).intValue();
				onOrderMap.put(pid, qty);
			}
		}

		Map<Long, ProductSales> salesMap = new HashMap<>();
		for (Object[] row : billItemRepository.salesByProductBetween(fromDt, toDt)) {
			Long productId = ((Number) row[0]).longValue();
			long qty = ((Number) row[1]).longValue();
			BigDecimal revenue = toBigDecimal(row[2]);
			salesMap.put(productId, new ProductSales(qty, revenue));
		}

		Map<Long, Integer> forecastMap = new HashMap<>();
		List<Product> allProducts = productRepository.findByActiveTrue();
		for (Product p : allProducts) {
			long s7 = sales7.getOrDefault(p.getId(), 0L);
			long s23 = sales23.getOrDefault(p.getId(), 0L);
			BigDecimal weightedSum = BigDecimal.valueOf(s7 * 2 + s23);
			BigDecimal avgDailySales = weightedSum.divide(BigDecimal.valueOf(37), 2, RoundingMode.HALF_UP);
			int forecast30 = (int) Math.ceil(avgDailySales.doubleValue() * 30);
			forecastMap.put(p.getId(), forecast30);
		}

		Map<String, List<Product>> byProductType = allProducts.stream()
				.collect(Collectors.groupingBy(p -> p.getProductType().trim().toLowerCase()));

		List<ProductMixResponse> responses = new ArrayList<>();

		for (Map.Entry<String, List<Product>> entry : byProductType.entrySet()) {
			List<Product> products = entry.getValue();
			if (products.isEmpty()) {
				continue;
			}

			String displayProductType = products.get(0).getProductType();
			String category = products.get(0).getCategory();

			long totalGroupStock = products.stream()
					.mapToLong(p -> p.getStockQuantity() == null ? 0 : p.getStockQuantity())
					.sum();

			int groupForecast30 = products.stream()
					.mapToInt(p -> forecastMap.getOrDefault(p.getId(), 0))
					.sum();

			List<ScoredProduct> scoredList = new ArrayList<>();
			for (Product p : products) {
				ProductSales ps = salesMap.getOrDefault(p.getId(), new ProductSales(0, BigDecimal.ZERO));
				BigDecimal costPrice = p.getCostPrice() != null ? p.getCostPrice() : BigDecimal.ZERO;
				BigDecimal profit = ps.revenue.subtract(costPrice.multiply(BigDecimal.valueOf(ps.qtySold))).setScale(2, RoundingMode.HALF_UP);

				BigDecimal marginPercent;
				if (ps.revenue.compareTo(BigDecimal.ZERO) > 0) {
					marginPercent = profit.multiply(BigDecimal.valueOf(100)).divide(ps.revenue, 2, RoundingMode.HALF_UP);
				} else if (p.getSellingPrice() != null && p.getSellingPrice().compareTo(BigDecimal.ZERO) > 0) {
					BigDecimal unitProfit = p.getSellingPrice().subtract(costPrice);
					marginPercent = unitProfit.multiply(BigDecimal.valueOf(100)).divide(p.getSellingPrice(), 2, RoundingMode.HALF_UP);
				} else {
					marginPercent = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
				}

				int stock = p.getStockQuantity() == null ? 0 : p.getStockQuantity();
				int onOrder = onOrderMap.getOrDefault(p.getId(), 0);

				BigDecimal currentShare;
				if (totalGroupStock > 0) {
					currentShare = BigDecimal.valueOf(stock).multiply(BigDecimal.valueOf(100))
							.divide(BigDecimal.valueOf(totalGroupStock), 2, RoundingMode.HALF_UP);
				} else {
					currentShare = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
				}

				scoredList.add(new ScoredProduct(p, marginPercent, ps.qtySold, profit, currentShare, stock, onOrder));
			}

			// Ties: higher margin percent first, then name
			scoredList.sort((a, b) -> {
				int cmp = b.profit.compareTo(a.profit);
				if (cmp != 0) return cmp;
				cmp = b.marginPercent.compareTo(a.marginPercent);
				if (cmp != 0) return cmp;
				return a.product.getName().compareToIgnoreCase(b.product.getName());
			});

			long distinctBrandCount = products.stream()
					.map(p -> p.getBrand() != null ? p.getBrand().trim() : "")
					.filter(b -> !b.isEmpty())
					.distinct()
					.count();

			String recommendation;
			if (distinctBrandCount < 2) {
				recommendation = "Only one brand, nothing to compare";
				for (ScoredProduct sp : scoredList) {
					sp.suggestedShare = new BigDecimal("100.00");
					sp.targetUnits = groupForecast30;
					sp.unitsToOrder = Math.max(0, sp.targetUnits - sp.stock - sp.onOrder);
				}
			} else {
				ScoredProduct top = scoredList.get(0);
				top.suggestedShare = new BigDecimal("80.00");

				List<ScoredProduct> others = scoredList.subList(1, scoredList.size());
				BigDecimal otherProfitSum = others.stream()
						.map(s -> s.profit.max(BigDecimal.ZERO))
						.reduce(BigDecimal.ZERO, BigDecimal::add);

				if (otherProfitSum.compareTo(BigDecimal.ZERO) > 0) {
					for (ScoredProduct sp : others) {
						sp.suggestedShare = sp.profit.max(BigDecimal.ZERO).multiply(new BigDecimal("20.00"))
								.divide(otherProfitSum, 2, RoundingMode.HALF_UP);
					}
				} else {
					BigDecimal equalShare = new BigDecimal("20.00")
							.divide(BigDecimal.valueOf(others.size()), 2, RoundingMode.HALF_UP);
					for (ScoredProduct sp : others) {
						sp.suggestedShare = equalShare;
					}
				}

				if (scoredList.size() == 2) {
					ScoredProduct second = scoredList.get(1);
					recommendation = "Keep 80% " + top.product.getBrand() + " and 20% " + second.product.getBrand()
							+ " because " + top.product.getBrand() + " earned more profit.";
				} else {
					recommendation = "Keep 80% " + top.product.getBrand() + " and distribute 20% among alternatives"
							+ " because " + top.product.getBrand() + " earned more profit.";
				}

				for (ScoredProduct sp : scoredList) {
					sp.targetUnits = (int) Math.round(groupForecast30 * sp.suggestedShare.doubleValue() / 100.0);
					sp.unitsToOrder = Math.max(0, sp.targetUnits - sp.stock - sp.onOrder);
				}
			}

			List<ProductMixResponse.ProductMixItem> items = scoredList.stream()
					.map(sp -> new ProductMixResponse.ProductMixItem(
							sp.product.getId(),
							sp.product.getName(),
							sp.product.getBrand(),
							sp.qtySold,
							sp.profit,
							sp.marginPercent,
							sp.currentShare,
							sp.suggestedShare,
							sp.targetUnits,
							sp.unitsToOrder,
							sp.stock,
							sp.onOrder))
					.collect(Collectors.toList());

			responses.add(new ProductMixResponse(displayProductType, category, groupForecast30, recommendation, items));
		}

		return responses;
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

	@Transactional(readOnly = true)
	public ParetoResponse getParetoAnalysis(int days) {
		LocalDate today = LocalDate.now(ZoneId.of("Asia/Kolkata"));
		LocalDateTime toDt = LocalDateTime.now(ZoneId.of("Asia/Kolkata"));
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

			ParetoItem pi = new ParetoItem();
			pi.setProductId(productId);
			pi.setName(name);
			pi.setBrand(brand);
			pi.setCategory(category);
			pi.setCurrentStock(stock);
			pi.setReorderThreshold(reorderThresh);
			pi.setQtySold((int) qtySold);
			pi.setRevenue(revenue);
			pi.setProfit(profit);
			pi.setMarginPercent(marginPercent);
			items.add(pi);
		}

		// Add products with 0 sales so entire catalog has Pareto classification
		for (Product p : allProducts) {
			if (!seenProductIds.contains(p.getId())) {
				ParetoItem pi = new ParetoItem();
				pi.setProductId(p.getId());
				pi.setName(p.getName());
				pi.setBrand(p.getBrand());
				pi.setCategory(p.getCategory());
				pi.setCurrentStock(p.getStockQuantity() != null ? p.getStockQuantity() : 0);
				pi.setReorderThreshold(p.getReorderThreshold() != null ? p.getReorderThreshold() : 10);
				pi.setQtySold(0);
				pi.setRevenue(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
				pi.setProfit(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
				pi.setMarginPercent(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
				items.add(pi);
			}
		}

		// Sort by profit descending, then margin, then name
		items.sort((a, b) -> {
			int cmp = b.getProfit().compareTo(a.getProfit());
			if (cmp != 0) return cmp;
			cmp = b.getMarginPercent().compareTo(a.getMarginPercent());
			if (cmp != 0) return cmp;
			return a.getName().compareToIgnoreCase(b.getName());
		});

		BigDecimal cumulative = BigDecimal.ZERO;
		int countA = 0;
		int countB = 0;
		int countC = 0;
		BigDecimal profitA = BigDecimal.ZERO;

		// Calculate shares and classes
		for (int i = 0; i < items.size(); i++) {
			ParetoItem pi = items.get(i);
			BigDecimal share = BigDecimal.ZERO;
			if (totalProfit.compareTo(BigDecimal.ZERO) > 0) {
				share = pi.getProfit().multiply(BigDecimal.valueOf(100)).divide(totalProfit, 2, RoundingMode.HALF_UP);
			}
			pi.setSharePercent(share);
			cumulative = cumulative.add(share);
			if (cumulative.compareTo(BigDecimal.valueOf(100)) > 0 || i == items.size() - 1) {
				cumulative = BigDecimal.valueOf(100).setScale(2, RoundingMode.HALF_UP);
			}
			pi.setCumulativePercent(cumulative.setScale(2, RoundingMode.HALF_UP));

			// Classify: Class A (up to 80% or top ~20% of catalog), Class B (80% - 95%), Class C (95%+)
			if (cumulative.compareTo(BigDecimal.valueOf(80.00)) <= 0 || i < Math.max(1, (int)(items.size() * 0.2))) {
				pi.setClassification("A");
				countA++;
				profitA = profitA.add(pi.getProfit());
				// Flag understocked fast movers: stock <= reorderThreshold or stock <= 15
				if (pi.getCurrentStock() <= pi.getReorderThreshold() || pi.getCurrentStock() <= 15) {
					pi.setIsUnderstocked(true);
					pi.setSuggestedReorderQty(Math.max(25, (pi.getReorderThreshold() * 2) - pi.getCurrentStock()));
				}
			} else if (cumulative.compareTo(BigDecimal.valueOf(95.00)) <= 0) {
				pi.setClassification("B");
				countB++;
			} else {
				pi.setClassification("C");
				countC++;
				if (pi.getCurrentStock() > 40) {
					pi.setIsOverstocked(true);
				}
			}
		}

		ParetoResponse res = new ParetoResponse();
		res.setItems(items);
		res.setTotalProducts(items.size());
		res.setClassACount(countA);
		res.setClassBCount(countB);
		res.setClassCCount(countC);
		res.setTotalProfit(totalProfit);
		res.setClassAProfit(profitA);
		BigDecimal pctA = BigDecimal.ZERO;
		if (totalProfit.compareTo(BigDecimal.ZERO) > 0) {
			pctA = profitA.multiply(BigDecimal.valueOf(100)).divide(totalProfit, 2, RoundingMode.HALF_UP);
		}
		res.setClassAProfitPercent(pctA);
		res.setSmartRecommendation("Smart Mix Strategy: Allocate ~80% of stock budget to Class A fast movers (" + countA 
				+ " products driving " + pctA + "% of profit) and ~20% to Class B/C items.");
		return res;
	}

	@Transactional(readOnly = true)
	public ExpiringDiscountedResponse getExpiringDiscounted(int daysBeforeExpiry) {
		LocalDate today = LocalDate.now(ZoneId.of("Asia/Kolkata"));
		LocalDate cutoff = today.plusDays(daysBeforeExpiry);

		List<Product> products = productRepository.findByActiveTrue();
		List<ExpiringProductItem> items = new ArrayList<>();
		int expiringCount = 0;
		int liveDiscounted = 0;
		BigDecimal totalRisk = BigDecimal.ZERO;

		for (Product p : products) {
			boolean isNearExpiry = p.getExpiryDate() != null && !p.getExpiryDate().isAfter(cutoff);
			boolean hasDiscount = p.getDiscountPercent() != null && p.getDiscountPercent().compareTo(BigDecimal.ZERO) > 0;

			if (isNearExpiry || hasDiscount) {
				long daysLeft = p.getExpiryDate() != null ? ChronoUnit.DAYS.between(today, p.getExpiryDate()) : 999;
				if (daysLeft < 0) daysLeft = 0;

				BigDecimal cost = p.getCostPrice() != null ? p.getCostPrice() : BigDecimal.ZERO;
				BigDecimal orig = p.getSellingPrice() != null ? p.getSellingPrice() : BigDecimal.ZERO;
				int stock = p.getStockQuantity() != null ? p.getStockQuantity() : 0;

				// Suggested discount tier: 1 day -> 30%, 2 days -> 20%, 3 days -> 10%
				BigDecimal suggested = BigDecimal.ZERO;
				if (daysLeft <= 1) suggested = new BigDecimal("30.00");
				else if (daysLeft == 2) suggested = new BigDecimal("20.00");
				else if (daysLeft == 3) suggested = new BigDecimal("10.00");

				BigDecimal currentDiscount = p.getDiscountPercent() != null ? p.getDiscountPercent() : suggested;
				BigDecimal factor = BigDecimal.ONE.subtract(currentDiscount.divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP));
				BigDecimal discountedPrice = orig.multiply(factor).setScale(2, RoundingMode.HALF_UP);
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
				item.setDiscountPercent(p.getDiscountPercent() != null ? p.getDiscountPercent() : BigDecimal.ZERO);
				item.setDiscountedPrice(discountedPrice);
				item.setSuggestedDiscount(suggested);
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

	private static class ProductSales {
		long qtySold;
		BigDecimal revenue;

		ProductSales(long qtySold, BigDecimal revenue) {
			this.qtySold = qtySold;
			this.revenue = revenue;
		}
	}

	private static class ScoredProduct {
		Product product;
		BigDecimal marginPercent;
		long qtySold;
		BigDecimal profit;
		BigDecimal currentShare;
		BigDecimal suggestedShare;
		int stock;
		int onOrder;
		int targetUnits;
		int unitsToOrder;

		ScoredProduct(Product product, BigDecimal marginPercent, long qtySold, BigDecimal profit,
				BigDecimal currentShare, int stock, int onOrder) {
			this.product = product;
			this.marginPercent = marginPercent;
			this.qtySold = qtySold;
			this.profit = profit;
			this.currentShare = currentShare;
			this.stock = stock;
			this.onOrder = onOrder;
		}
	}
}
