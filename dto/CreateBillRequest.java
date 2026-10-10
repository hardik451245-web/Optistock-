package com.optistock.dto;

import java.util.ArrayList;
import java.util.List;

public class CreateBillRequest {

	private List<BillLineRequest> items = new ArrayList<>();

	public List<BillLineRequest> getItems() {
		return items;
	}

	public void setItems(List<BillLineRequest> items) {
		this.items = items;
	}
}
