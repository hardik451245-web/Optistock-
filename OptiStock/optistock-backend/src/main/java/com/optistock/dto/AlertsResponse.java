package com.optistock.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import com.optistock.entity.ExpiryStatus;

public class AlertsResponse {

	private List<LowStockItem> lowStock;
	private List<ExpiringSoonItem> expiringSoon;
	private List<MarkdownItem> markdownActive;
	private List<ExpiredItem> expired;
	private List<SlowMovingItem> slowMoving;

	public AlertsResponse(List<LowStockItem> lowStock, List<ExpiringSoonItem> expiringSoon,
			List<MarkdownItem> markdownActive, List<ExpiredItem> expired, List<SlowMovingItem> slowMoving) {
		this.lowStock = lowStock;
		this.expiringSoon = expiringSoon;
		this.markdownActive = markdownActive;
		this.expired = expired;
		this.slowMoving = slowMoving;
	}

	public List<LowStockItem> getLowStock() { return lowStock; }
	public List<ExpiringSoonItem> getExpiringSoon() { return expiringSoon; }
	public List<MarkdownItem> getMarkdownActive() { return markdownActive; }
	public List<ExpiredItem> getExpired() { return expired; }
	public List<SlowMovingItem> getSlowMoving() { return slowMoving; }

	public static class LowStockItem {
		private Long productId;
		private String name;
		private Integer stock;
		private Integer reorderThreshold;

		public LowStockItem(Long productId, String name, Integer stock, Integer reorderThreshold) {
			this.productId = productId;
			this.name = name;
			this.stock = stock;
			this.reorderThreshold = reorderThreshold;
		}

		public Long getId() { return productId; }
		public Long getProductId() { return productId; }
		public String getName() { return name; }
		public Integer getStock() { return stock; }
		public Integer getReorderThreshold() { return reorderThreshold; }
	}

	public static class ExpiringSoonItem {
		private Long productId;
		private String name;
		private long daysLeft;
		private LocalDate expiryDate;

		public ExpiringSoonItem(Long productId, String name, long daysLeft, LocalDate expiryDate) {
			this.productId = productId;
			this.name = name;
			this.daysLeft = daysLeft;
			this.expiryDate = expiryDate;
		}

		public Long getId() { return productId; }
		public Long getProductId() { return productId; }
		public String getName() { return name; }
		public long getDaysLeft() { return daysLeft; }
		public LocalDate getExpiryDate() { return expiryDate; }
	}

	public static class MarkdownItem {
		private Long productId;
		private String name;
		private BigDecimal discountPercent;
		private BigDecimal effectivePrice;
		private long daysLeft;
		private ExpiryStatus status;

		public MarkdownItem(Long productId, String name, BigDecimal discountPercent,
				BigDecimal effectivePrice, long daysLeft, ExpiryStatus status) {
			this.productId = productId;
			this.name = name;
			this.discountPercent = discountPercent;
			this.effectivePrice = effectivePrice;
			this.daysLeft = daysLeft;
			this.status = status;
		}

		public Long getId() { return productId; }
		public Long getProductId() { return productId; }
		public String getName() { return name; }
		public BigDecimal getDiscountPercent() { return discountPercent; }
		public BigDecimal getEffectivePrice() { return effectivePrice; }
		public long getDaysLeft() { return daysLeft; }
		public ExpiryStatus getStatus() { return status; }
	}

	public static class ExpiredItem {
		private Long productId;
		private String name;
		private Integer stock;
		private LocalDate expiryDate;

		public ExpiredItem(Long productId, String name, Integer stock, LocalDate expiryDate) {
			this.productId = productId;
			this.name = name;
			this.stock = stock;
			this.expiryDate = expiryDate;
		}

		public Long getId() { return productId; }
		public Long getProductId() { return productId; }
		public String getName() { return name; }
		public Integer getStock() { return stock; }
		public LocalDate getExpiryDate() { return expiryDate; }
	}

	public static class SlowMovingItem {
		private Long productId;
		private String name;
		private Integer stock;
		private long sales30Days;

		public SlowMovingItem(Long productId, String name, Integer stock, long sales30Days) {
			this.productId = productId;
			this.name = name;
			this.stock = stock;
			this.sales30Days = sales30Days;
		}

		public Long getId() { return productId; }
		public Long getProductId() { return productId; }
		public String getName() { return name; }
		public Integer getStock() { return stock; }
		public long getSales30Days() { return sales30Days; }
	}
}
