package com.optistock.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import com.optistock.entity.BillStatus;

public class BillResponse {

	private Long id;
	private Long cashierId;
	private BigDecimal totalAmount;
	private BigDecimal subtotal;
	private BigDecimal totalDiscount;
	private BillStatus status;
	private LocalDateTime cancelledAt;
	private LocalDateTime createdAt;
	private List<BillItemResponse> items;

	public BillResponse(Long id, Long cashierId, BigDecimal totalAmount, BigDecimal subtotal,
			BigDecimal totalDiscount, BillStatus status, LocalDateTime cancelledAt,
			LocalDateTime createdAt, List<BillItemResponse> items) {
		this.id = id;
		this.cashierId = cashierId;
		this.totalAmount = totalAmount;
		this.subtotal = subtotal;
		this.totalDiscount = totalDiscount;
		this.status = status;
		this.cancelledAt = cancelledAt;
		this.createdAt = createdAt;
		this.items = items;
	}

	public Long getId() {
		return id;
	}

	public Long getCashierId() {
		return cashierId;
	}

	public BigDecimal getTotalAmount() {
		return totalAmount;
	}

	public BigDecimal getSubtotal() {
		return subtotal;
	}

	public BigDecimal getTotalDiscount() {
		return totalDiscount;
	}

	public BillStatus getStatus() {
		return status;
	}

	public LocalDateTime getCancelledAt() {
		return cancelledAt;
	}

	public LocalDateTime getCreatedAt() {
		return createdAt;
	}

	public List<BillItemResponse> getItems() {
		return items;
	}
}
