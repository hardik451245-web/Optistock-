package com.optistock.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.optistock.dto.PriceQuote;
import com.optistock.dto.ProductRequest;
import com.optistock.dto.ProductResponse;
import com.optistock.entity.Product;
import com.optistock.exception.ResourceNotFoundException;
import com.optistock.repository.ProductRepository;

import com.optistock.repository.PurchaseOrderRepository;

@Service
public class ProductService {

	private final ProductRepository productRepository;
	private final ExpiryPricingService expiryPricingService;
	private final PurchaseOrderRepository purchaseOrderRepository;
	private final java.time.Clock clock;

	@org.springframework.beans.factory.annotation.Autowired
	public ProductService(ProductRepository productRepository, ExpiryPricingService expiryPricingService,
			PurchaseOrderRepository purchaseOrderRepository, java.time.Clock clock) {
		this.productRepository = productRepository;
		this.expiryPricingService = expiryPricingService;
		this.purchaseOrderRepository = purchaseOrderRepository;
		this.clock = clock != null ? clock : java.time.Clock.system(java.time.ZoneId.of("Asia/Kolkata"));
	}

	public ProductService(ProductRepository productRepository, ExpiryPricingService expiryPricingService,
			PurchaseOrderRepository purchaseOrderRepository) {
		this(productRepository, expiryPricingService, purchaseOrderRepository, java.time.Clock.system(java.time.ZoneId.of("Asia/Kolkata")));
	}

	public ProductService(ProductRepository productRepository, ExpiryPricingService expiryPricingService) {
		this(productRepository, expiryPricingService, null, java.time.Clock.system(java.time.ZoneId.of("Asia/Kolkata")));
	}

	public List<ProductResponse> listProducts() {
		LocalDate today = LocalDate.now(clock);
		return productRepository.findByActiveTrue().stream()
				.map(p -> toResponse(p, today))
				.collect(Collectors.toList());
	}

	public ProductResponse getProduct(Long id) {
		LocalDate today = LocalDate.now(clock);
		Product product = productRepository.findByIdAndActiveTrue(id)
				.orElseThrow(() -> new ResourceNotFoundException("Product " + id + " not found"));
		return toResponse(product, today);
	}

	@Transactional
	public ProductResponse addProduct(ProductRequest request) {
		validate(request);
		Product product = new Product();
		apply(product, request);
		product.setActive(true);
		product = productRepository.save(product);
		return toResponse(product, LocalDate.now(clock));
	}

	@Transactional
	public ProductResponse updateProduct(Long id, ProductRequest request) {
		validate(request);
		Product product = productRepository.findByIdAndActiveTrue(id)
				.orElseThrow(() -> new ResourceNotFoundException("Product " + id + " not found"));
		apply(product, request);
		product = productRepository.save(product);
		return toResponse(product, LocalDate.now(clock));
	}

	@Transactional
	public void deleteProduct(Long id) {
		Product product = productRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Product " + id + " not found"));
		product.setActive(false);
		productRepository.save(product);
	}

	public List<ProductResponse> findAlternatives(Long productId) {
		LocalDate today = LocalDate.now(clock);
		Product source = productRepository.findByIdAndActiveTrue(productId)
				.orElseThrow(() -> new ResourceNotFoundException("Product " + productId + " not found"));

		if (source.getCategory() == null || source.getCategory().isBlank()) {
			return List.of();
		}

		PriceQuote sourceQuote = expiryPricingService.quote(source, today);

		return productRepository.findByCategoryAndIdNotAndActiveTrue(source.getCategory(), productId).stream()
				.filter(p -> p.getStockQuantity() != null && p.getStockQuantity() > 0)
				.map(p -> {
					PriceQuote q = expiryPricingService.quote(p, today);
					return new AlternativeCandidate(p, q);
				})
				.sorted(alternativeComparator(source.getBrand(), sourceQuote.getEffectivePrice()))
				.limit(4)
				.map(c -> toResponse(c.product, c.quote))
				.collect(Collectors.toList());
	}

	private Comparator<AlternativeCandidate> alternativeComparator(String sourceBrand, BigDecimal sourceEffective) {
		return Comparator
				.<AlternativeCandidate, Integer>comparing(c -> {
					String brand = c.product.getBrand();
					boolean sameBrand = brand != null && sourceBrand != null && brand.equalsIgnoreCase(sourceBrand);
					return sameBrand ? 0 : 1;
				})
				.thenComparing(c -> c.quote.getEffectivePrice().subtract(sourceEffective).abs())
				.thenComparing(c -> {
					BigDecimal cost = c.product.getCostPrice() == null ? BigDecimal.ZERO : c.product.getCostPrice();
					return c.quote.getEffectivePrice().subtract(cost);
				}, Comparator.reverseOrder());
	}

	private void validate(ProductRequest request) {
		if (request.getName() == null || request.getName().isBlank()) {
			throw new IllegalArgumentException("Product name is required");
		}
		if (request.getCostPrice() != null && request.getCostPrice().compareTo(BigDecimal.ZERO) < 0) {
			throw new IllegalArgumentException("Cost price must be >= 0");
		}
		if (request.getSellingPrice() != null && request.getSellingPrice().compareTo(BigDecimal.ZERO) < 0) {
			throw new IllegalArgumentException("Selling price must be >= 0");
		}
		if (request.getStockQuantity() != null && request.getStockQuantity() < 0) {
			throw new IllegalArgumentException("Stock quantity must be >= 0");
		}
	}

	private void apply(Product product, ProductRequest request) {
		product.setName(request.getName());
		product.setBrand(request.getBrand());
		product.setCategory(request.getCategory());
		String pType = (request.getProductType() != null && !request.getProductType().isBlank())
				? request.getProductType().trim()
				: request.getCategory();
		product.setProductType(pType != null ? pType.trim() : null);
		product.setCostPrice(request.getCostPrice());
		product.setSellingPrice(request.getSellingPrice());
		product.setStockQuantity(request.getStockQuantity());
		product.setReorderThreshold(request.getReorderThreshold());
		product.setExpiryDate(request.getExpiryDate());
	}

	private ProductResponse toResponse(Product product, LocalDate today) {
		PriceQuote quote = expiryPricingService.quote(product, today);
		return toResponse(product, quote);
	}

	private ProductResponse toResponse(Product product, PriceQuote quote) {
		int onOrder = 0;
		if (purchaseOrderRepository != null && product.getId() != null) {
			onOrder = purchaseOrderRepository.sumOrderedQuantityByProductId(product.getId());
		}
		return new ProductResponse(
				product.getId(),
				product.getName(),
				product.getBrand(),
				product.getCategory(),
				product.getProductType(),
				product.getCostPrice(),
				product.getSellingPrice(),
				product.getStockQuantity(),
				product.getReorderThreshold(),
				product.getExpiryDate(),
				quote.getEffectivePrice(),
				quote.getDiscountPercent(),
				quote.getDaysLeft(),
				quote.getStatus(),
				onOrder);
	}

	private static class AlternativeCandidate {
		final Product product;
		final PriceQuote quote;

		AlternativeCandidate(Product product, PriceQuote quote) {
			this.product = product;
			this.quote = quote;
		}
	}
}
