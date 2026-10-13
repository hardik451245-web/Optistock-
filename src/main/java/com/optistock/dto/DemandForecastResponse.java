package com.optistock.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class DemandForecastResponse {

	private int productsAtRisk;
	private int totalForecastUnits;
	private String overallAccuracy;
	private int productsNeedingReorder;
	private List<ProductDemandForecast> items = new ArrayList<>();

	public DemandForecastResponse() {
	}

	public DemandForecastResponse(int productsAtRisk, int totalForecastUnits, String overallAccuracy,
			int productsNeedingReorder, List<ProductDemandForecast> items) {
		this.productsAtRisk = productsAtRisk;
		this.totalForecastUnits = totalForecastUnits;
		this.overallAccuracy = overallAccuracy;
		this.productsNeedingReorder = productsNeedingReorder;
		this.items = items != null ? items : new ArrayList<>();
	}

	public int getProductsAtRisk() {
		return productsAtRisk;
	}

	public void setProductsAtRisk(int productsAtRisk) {
		this.productsAtRisk = productsAtRisk;
	}

	public int getTotalForecastUnits() {
		return totalForecastUnits;
	}

	public void setTotalForecastUnits(int totalForecastUnits) {
		this.totalForecastUnits = totalForecastUnits;
	}

	public String getOverallAccuracy() {
		return overallAccuracy;
	}

	public void setOverallAccuracy(String overallAccuracy) {
		this.overallAccuracy = overallAccuracy;
	}

	public int getProductsNeedingReorder() {
		return productsNeedingReorder;
	}

	public void setProductsNeedingReorder(int productsNeedingReorder) {
		this.productsNeedingReorder = productsNeedingReorder;
	}

	public List<ProductDemandForecast> getItems() {
		return items;
	}

	public void setItems(List<ProductDemandForecast> items) {
		this.items = items;
	}

	public static class ProductDemandForecast {
		private Long id;
		private String name;
		private String brand;
		private String category;
		private String productType;
		private int stock;
		private int onOrder;
		private BigDecimal avgDaily;
		private int forecastTotal;
		private List<DailyForecastPoint> dailyForecast = new ArrayList<>();
		private List<DailyHistoryPoint> history30 = new ArrayList<>();
		private BigDecimal daysOfCover;
		private LocalDate predictedStockOutDate;
		private BigDecimal trendPercent;
		private int suggestedOrder;
		private String backtestError;
		private CalcDetails calcDetails;

		public ProductDemandForecast() {
		}

		public Long getId() {
			return id;
		}

		public void setId(Long id) {
			this.id = id;
		}

		public String getName() {
			return name;
		}

		public void setName(String name) {
			this.name = name;
		}

		public String getBrand() {
			return brand;
		}

		public void setBrand(String brand) {
			this.brand = brand;
		}

		public String getCategory() {
			return category;
		}

		public void setCategory(String category) {
			this.category = category;
		}

		public String getProductType() {
			return productType;
		}

		public void setProductType(String productType) {
			this.productType = productType;
		}

		public int getStock() {
			return stock;
		}

		public void setStock(int stock) {
			this.stock = stock;
		}

		public int getOnOrder() {
			return onOrder;
		}

		public void setOnOrder(int onOrder) {
			this.onOrder = onOrder;
		}

		public BigDecimal getAvgDaily() {
			return avgDaily;
		}

		public void setAvgDaily(BigDecimal avgDaily) {
			this.avgDaily = avgDaily;
		}

		public int getForecastTotal() {
			return forecastTotal;
		}

		public void setForecastTotal(int forecastTotal) {
			this.forecastTotal = forecastTotal;
		}

		public List<DailyForecastPoint> getDailyForecast() {
			return dailyForecast;
		}

		public void setDailyForecast(List<DailyForecastPoint> dailyForecast) {
			this.dailyForecast = dailyForecast;
		}

		public List<DailyHistoryPoint> getHistory30() {
			return history30;
		}

		public void setHistory30(List<DailyHistoryPoint> history30) {
			this.history30 = history30;
		}

		public BigDecimal getDaysOfCover() {
			return daysOfCover;
		}

		public void setDaysOfCover(BigDecimal daysOfCover) {
			this.daysOfCover = daysOfCover;
		}

		public LocalDate getPredictedStockOutDate() {
			return predictedStockOutDate;
		}

		public void setPredictedStockOutDate(LocalDate predictedStockOutDate) {
			this.predictedStockOutDate = predictedStockOutDate;
		}

		public BigDecimal getTrendPercent() {
			return trendPercent;
		}

		public void setTrendPercent(BigDecimal trendPercent) {
			this.trendPercent = trendPercent;
		}

		public int getSuggestedOrder() {
			return suggestedOrder;
		}

		public void setSuggestedOrder(int suggestedOrder) {
			this.suggestedOrder = suggestedOrder;
		}

		public String getBacktestError() {
			return backtestError;
		}

		public void setBacktestError(String backtestError) {
			this.backtestError = backtestError;
		}

		public CalcDetails getCalcDetails() {
			return calcDetails;
		}

		public void setCalcDetails(CalcDetails calcDetails) {
			this.calcDetails = calcDetails;
		}
	}

	public static class DailyForecastPoint {
		private String date;
		private String dayOfWeek;
		private BigDecimal forecast;
		private BigDecimal lower;
		private BigDecimal upper;

		public DailyForecastPoint() {
		}

		public DailyForecastPoint(String date, String dayOfWeek, BigDecimal forecast, BigDecimal lower, BigDecimal upper) {
			this.date = date;
			this.dayOfWeek = dayOfWeek;
			this.forecast = forecast;
			this.lower = lower;
			this.upper = upper;
		}

		public String getDate() {
			return date;
		}

		public void setDate(String date) {
			this.date = date;
		}

		public String getDayOfWeek() {
			return dayOfWeek;
		}

		public void setDayOfWeek(String dayOfWeek) {
			this.dayOfWeek = dayOfWeek;
		}

		public BigDecimal getForecast() {
			return forecast;
		}

		public void setForecast(BigDecimal forecast) {
			this.forecast = forecast;
		}

		public BigDecimal getLower() {
			return lower;
		}

		public void setLower(BigDecimal lower) {
			this.lower = lower;
		}

		public BigDecimal getUpper() {
			return upper;
		}

		public void setUpper(BigDecimal upper) {
			this.upper = upper;
		}
	}

	public static class DailyHistoryPoint {
		private String date;
		private long units;

		public DailyHistoryPoint() {
		}

		public DailyHistoryPoint(String date, long units) {
			this.date = date;
			this.units = units;
		}

		public String getDate() {
			return date;
		}

		public void setDate(String date) {
			this.date = date;
		}

		public long getUnits() {
			return units;
		}

		public void setUnits(long units) {
			this.units = units;
		}
	}

	public static class CalcDetails {
		private BigDecimal baselineA;
		private Map<String, BigDecimal> weekdayFactors;
		private BigDecimal standardDeviation;
		private int stock;
		private int onOrder;
		private int forecast30;
		private int target30;
		private int suggestedOrder;
		private Long daysLeft;
		private Integer expiryCap;

		public CalcDetails() {
		}

		public BigDecimal getBaselineA() {
			return baselineA;
		}

		public void setBaselineA(BigDecimal baselineA) {
			this.baselineA = baselineA;
		}

		public Map<String, BigDecimal> getWeekdayFactors() {
			return weekdayFactors;
		}

		public void setWeekdayFactors(Map<String, BigDecimal> weekdayFactors) {
			this.weekdayFactors = weekdayFactors;
		}

		public BigDecimal getStandardDeviation() {
			return standardDeviation;
		}

		public void setStandardDeviation(BigDecimal standardDeviation) {
			this.standardDeviation = standardDeviation;
		}

		public int getStock() {
			return stock;
		}

		public void setStock(int stock) {
			this.stock = stock;
		}

		public int getOnOrder() {
			return onOrder;
		}

		public void setOnOrder(int onOrder) {
			this.onOrder = onOrder;
		}

		public int getForecast30() {
			return forecast30;
		}

		public void setForecast30(int forecast30) {
			this.forecast30 = forecast30;
		}

		public int getTarget30() {
			return target30;
		}

		public void setTarget30(int target30) {
			this.target30 = target30;
		}

		public int getSuggestedOrder() {
			return suggestedOrder;
		}

		public void setSuggestedOrder(int suggestedOrder) {
			this.suggestedOrder = suggestedOrder;
		}

		public Long getDaysLeft() {
			return daysLeft;
		}

		public void setDaysLeft(Long daysLeft) {
			this.daysLeft = daysLeft;
		}

		public Integer getExpiryCap() {
			return expiryCap;
		}

		public void setExpiryCap(Integer expiryCap) {
			this.expiryCap = expiryCap;
		}
	}
}
