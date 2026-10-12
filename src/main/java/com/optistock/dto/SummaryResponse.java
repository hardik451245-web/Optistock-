package com.optistock.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class SummaryResponse {

	private long billCount;
	private long itemsSold;
	private BigDecimal grossSales;
	private BigDecimal totalDiscountGiven;
	private BigDecimal netSales;
	private long cancelledBillCount;
	private BigDecimal cancelledAmount;
	private BigDecimal markdownSalesAmount;
	private long belowCostItemCount;
	private List<DailyTotal> dailyTotals;
	private List<TopProduct> top5Products;

	public SummaryResponse(long billCount, long itemsSold, BigDecimal grossSales, BigDecimal totalDiscountGiven,
			BigDecimal netSales, long cancelledBillCount, BigDecimal cancelledAmount,
			BigDecimal markdownSalesAmount, long belowCostItemCount,
			List<DailyTotal> dailyTotals, List<TopProduct> top5Products) {
		this.billCount = billCount;
		this.itemsSold = itemsSold;
		this.grossSales = grossSales;
		this.totalDiscountGiven = totalDiscountGiven;
		this.netSales = netSales;
		this.cancelledBillCount = cancelledBillCount;
		this.cancelledAmount = cancelledAmount;
		this.markdownSalesAmount = markdownSalesAmount;
		this.belowCostItemCount = belowCostItemCount;
		this.dailyTotals = dailyTotals;
		this.top5Products = top5Products;
	}

	public long getBillCount() { return billCount; }
	public long getItemsSold() { return itemsSold; }
	public BigDecimal getGrossSales() { return grossSales; }
	public BigDecimal getTotalDiscountGiven() { return totalDiscountGiven; }
	public BigDecimal getNetSales() { return netSales; }
	public long getCancelledBillCount() { return cancelledBillCount; }
	public BigDecimal getCancelledAmount() { return cancelledAmount; }
	public BigDecimal getMarkdownSalesAmount() { return markdownSalesAmount; }
	public long getBelowCostItemCount() { return belowCostItemCount; }
	public List<DailyTotal> getDailyTotals() { return dailyTotals; }
	public List<TopProduct> getTop5Products() { return top5Products; }

	public static class DailyTotal {
		private LocalDate date;
		private long bills;
		private BigDecimal netSales;

		public DailyTotal(LocalDate date, long bills, BigDecimal netSales) {
			this.date = date;
			this.bills = bills;
			this.netSales = netSales;
		}

		public LocalDate getDate() { return date; }
		public long getBills() { return bills; }
		public BigDecimal getNetSales() { return netSales; }
	}

	public static class TopProduct {
		private String name;
		private long qtySold;
		private BigDecimal revenue;

		public TopProduct(String name, long qtySold, BigDecimal revenue) {
			this.name = name;
			this.qtySold = qtySold;
			this.revenue = revenue;
		}

		public String getName() { return name; }
		public long getQtySold() { return qtySold; }
		public BigDecimal getRevenue() { return revenue; }
	}
}
