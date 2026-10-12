package com.optistock.dto;

import java.math.BigDecimal;
import java.util.List;

public class ExpiringDiscountedResponse {

	private List<ExpiringProductItem> items;
	private int expiringSoonCount;
	private int discountedLiveCount;
	private BigDecimal totalRiskValue;
	private int daysBeforeExpirySetting;

	public ExpiringDiscountedResponse() {
	}

	public List<ExpiringProductItem> getItems() {
		return items;
	}

	public void setItems(List<ExpiringProductItem> items) {
		this.items = items;
	}

	public int getExpiringSoonCount() {
		return expiringSoonCount;
	}

	public void setExpiringSoonCount(int expiringSoonCount) {
		this.expiringSoonCount = expiringSoonCount;
	}

	public int getDiscountedLiveCount() {
		return discountedLiveCount;
	}

	public void setDiscountedLiveCount(int discountedLiveCount) {
		this.discountedLiveCount = discountedLiveCount;
	}

	public BigDecimal getTotalRiskValue() {
		return totalRiskValue;
	}

	public void setTotalRiskValue(BigDecimal totalRiskValue) {
		this.totalRiskValue = totalRiskValue;
	}

	public int getDaysBeforeExpirySetting() {
		return daysBeforeExpirySetting;
	}

	public void setDaysBeforeExpirySetting(int daysBeforeExpirySetting) {
		this.daysBeforeExpirySetting = daysBeforeExpirySetting;
	}
}
