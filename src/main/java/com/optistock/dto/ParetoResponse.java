package com.optistock.dto;

import java.math.BigDecimal;
import java.util.List;

public class ParetoResponse {

	private List<ParetoItem> items;
	private int totalProducts;
	private int classACount;
	private int classBCount;
	private int classCCount;
	private BigDecimal totalProfit;
	private BigDecimal classAProfit;
	private BigDecimal classAProfitPercent;
	private String smartRecommendation;

	public ParetoResponse() {
	}

	public List<ParetoItem> getItems() {
		return items;
	}

	public void setItems(List<ParetoItem> items) {
		this.items = items;
	}

	public int getTotalProducts() {
		return totalProducts;
	}

	public void setTotalProducts(int totalProducts) {
		this.totalProducts = totalProducts;
	}

	public int getClassACount() {
		return classACount;
	}

	public void setClassACount(int classACount) {
		this.classACount = classACount;
	}

	public int getClassBCount() {
		return classBCount;
	}

	public void setClassBCount(int classBCount) {
		this.classBCount = classBCount;
	}

	public int getClassCCount() {
		return classCCount;
	}

	public void setClassCCount(int classCCount) {
		this.classCCount = classCCount;
	}

	public BigDecimal getTotalProfit() {
		return totalProfit;
	}

	public void setTotalProfit(BigDecimal totalProfit) {
		this.totalProfit = totalProfit;
	}

	public BigDecimal getClassAProfit() {
		return classAProfit;
	}

	public void setClassAProfit(BigDecimal classAProfit) {
		this.classAProfit = classAProfit;
	}

	public BigDecimal getClassAProfitPercent() {
		return classAProfitPercent;
	}

	public void setClassAProfitPercent(BigDecimal classAProfitPercent) {
		this.classAProfitPercent = classAProfitPercent;
	}

	public String getSmartRecommendation() {
		return smartRecommendation;
	}

	public void setSmartRecommendation(String smartRecommendation) {
		this.smartRecommendation = smartRecommendation;
	}

	private BigDecimal totalRevenue;

	public BigDecimal getTotalRevenue() {
		return totalRevenue;
	}

	public void setTotalRevenue(BigDecimal totalRevenue) {
		this.totalRevenue = totalRevenue;
	}
}
