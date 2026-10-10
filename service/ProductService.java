package com.optistock.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
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

@Service
public class ProductService {

	private final ProductRepository productRepository;
	private final ExpiryPricingService expiryPricingService;

	public ProductService(ProductRepository productRepository, ExpiryPricingService expiryPricingService) {
		this.productRepository = productRepository;
		this.expiryPricingService = expiryPricingService;
	}

	public List<ProductResponse> listProducts() {
		LocalDate today = LocalDate.now(ZoneId.of("Asia/Kolkata"));
		return productRepository.findAll().stream()
				.map(p -> toResponse(p, today))
				.collect(Collectors.toList());
	}

	public ProductResponse getProduct(Long id) {
		LocalDate today = LocalDate.now(ZoneId.of("Asia/Kolkata"));
		Product product = productRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Product not found: " + id));
		return toResponse(product, today);
	}

	@Transactional
	public ProductResponse addProduct(ProductRequest request) {
		validate(request);
		Product product = new Product();
		apply(product, request);
		product = productRepository.save(product);
		return toResponse(product, LocalDate.now(ZoneId.of("Asia/Kolkata")));
	}

	@Transactional
	public ProductResponse updateProduct(Long id, ProductRequest request) {
		validate(request);
		Product product = productRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Product not found: " + id));
		apply(product, request);
		product = productRepository.save(product);
		return toResponse(product, LocalDate.now(ZoneId.of("Asia/Kolkata")));
	}

	@Transactional
	public void deleteProduct(Long id) {
		if (!productRepository.existsById(id)) {
			throw new ResourceNotFoundException("Product not found: " + id);
		}
		productRepository.deleteById(id);
	}

	public List<ProductResponse> findAlternatives(Long productId) {
		LocalDate today = LocalDate.now(ZoneId.of("Asia/Kolkata"));
		Product source = productRepository.findById(productId)
				.orElseThrow(() -> new ResourceNotFoundException("Product not found: " + productId));

		if (source.getCategory() == null || source.getCategory().isBlank()) {
			return List.of();
		}

		PriceQuote sourceQuote = expiryPricingService.quote(source, today);

		return productRepository.findByCategoryAndIdNot(source.getCategory(), productId).stream()
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
		return new ProductResponse(
				product.getId(),
				product.getName(),
				product.getBrand(),
				product.getCategory(),
				product.getCostPrice(),
				product.getSellingPrice(),
				product.getStockQuantity(),
				product.getReorderThreshold(),
				product.getExpiryDate(),
				quote.getEffectivePrice(),
				quote.getDiscountPercent(),
				quote.getDaysLeft(),
				quote.getStatus());
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
