package com.optistock.entity;

public enum PurchaseOrderStatus {
	PENDING,
	SUGGESTED, // alias for PENDING
	ORDERED,
	APPROVED, // alias for ORDERED
	RECEIVED,
	CANCELLED
}
