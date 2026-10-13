package com.optistock.dto;

import java.time.LocalDate;

public class ReceivePurchaseOrderRequest {

	private Integer receivedQuantity;
	private LocalDate newExpiryDate;

	public ReceivePurchaseOrderRequest() {
	}

	public ReceivePurchaseOrderRequest(Integer receivedQuantity, LocalDate newExpiryDate) {
		this.receivedQuantity = receivedQuantity;
		this.newExpiryDate = newExpiryDate;
	}

	public Integer getReceivedQuantity() {
		return receivedQuantity;
	}

	public void setReceivedQuantity(Integer receivedQuantity) {
		this.receivedQuantity = receivedQuantity;
	}

	public LocalDate getNewExpiryDate() {
		return newExpiryDate;
	}

	public void setNewExpiryDate(LocalDate newExpiryDate) {
		this.newExpiryDate = newExpiryDate;
	}
}
