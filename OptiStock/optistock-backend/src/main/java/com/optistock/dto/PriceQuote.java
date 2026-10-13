package com.optistock.dto;

import java.math.BigDecimal;

import com.optistock.entity.ExpiryStatus;

public class PriceQuote {

	private final BigDecimal basePrice;
	private final BigDecimal discountPercent;
	private final BigDecimal effectivePrice;
	private final long daysLeft;
	private final ExpiryStatus status;
	private final boolean belowCost;

	public PriceQuote(BigDecimal basePrice, BigDecimal discountPercent, BigDecimal effectivePrice,
			long daysLeft, ExpiryStatus status, boolean belowCost) {
		this.basePrice = basePrice;
		this.discountPercent = discountPercent;
		this.effectivePrice = effectivePrice;
		this.daysLeft = daysLeft;
		this.status = status;
		this.belowCost = belowCost;
	}

	public BigDecimal getBasePrice() {
		return basePrice;
	}

	public BigDecimal getDiscountPercent() {
		return discountPercent;
	}

	public BigDecimal getEffectivePrice() {
		return effectivePrice;
	}

	public long getDaysLeft() {
		return daysLeft;
	}

	public ExpiryStatus getStatus() {
		return status;
	}

	public boolean isBelowCost() {
		return belowCost;
	}
}
