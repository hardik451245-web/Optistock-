package com.optistock.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

import org.springframework.stereotype.Service;

import com.optistock.config.MarkdownProperties;
import com.optistock.dto.PriceQuote;
import com.optistock.entity.ExpiryStatus;
import com.optistock.entity.Product;

@Service
public class ExpiryPricingService {

	private final MarkdownProperties props;

	public ExpiryPricingService(MarkdownProperties props) {
		this.props = props;
	}

	public PriceQuote quote(Product product, LocalDate today) {
		BigDecimal basePrice = product.getSellingPrice() == null ? BigDecimal.ZERO : product.getSellingPrice();
		BigDecimal explicitDiscount = product.getDiscountPercent() != null ? product.getDiscountPercent() : BigDecimal.ZERO;

		if (product.getExpiryDate() == null) {
			if (explicitDiscount.compareTo(BigDecimal.ZERO) > 0) {
				return applyDiscount(basePrice, explicitDiscount, 0, ExpiryStatus.NORMAL, product.getCostPrice());
			}
			return buildQuote(basePrice, BigDecimal.ZERO, basePrice, 0, ExpiryStatus.NO_EXPIRY, product.getCostPrice());
		}

		long daysLeft = ChronoUnit.DAYS.between(today, product.getExpiryDate());

		if (daysLeft < 0) {
			BigDecimal zero = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
			return new PriceQuote(basePrice, new BigDecimal("100.00"), zero, daysLeft, ExpiryStatus.EXPIRED, false);
		}

		if (daysLeft == 0) {
			BigDecimal discountPct = BigDecimal.valueOf(props.getLastDayDiscount()).max(explicitDiscount);
			return applyDiscount(basePrice, discountPct, daysLeft, ExpiryStatus.LAST_DAY, product.getCostPrice());
		}

		if (daysLeft >= props.getMarkdownLower() && daysLeft <= props.getMarkdownUpper()) {
			BigDecimal discountPct = BigDecimal.valueOf(props.getMarkdownDiscount()).max(explicitDiscount);
			return applyDiscount(basePrice, discountPct, daysLeft, ExpiryStatus.MARKDOWN, product.getCostPrice());
		}

		if (explicitDiscount.compareTo(BigDecimal.ZERO) > 0) {
			return applyDiscount(basePrice, explicitDiscount, daysLeft, ExpiryStatus.MARKDOWN, product.getCostPrice());
		}

		if (daysLeft >= props.getExpiringSoonLower() && daysLeft <= props.getExpiringSoonUpper()) {
			return buildQuote(basePrice, BigDecimal.ZERO, basePrice, daysLeft, ExpiryStatus.EXPIRING_SOON, product.getCostPrice());
		}

		return buildQuote(basePrice, BigDecimal.ZERO, basePrice, daysLeft, ExpiryStatus.NORMAL, product.getCostPrice());
	}

	private PriceQuote applyDiscount(BigDecimal basePrice, BigDecimal discountPct, long daysLeft,
			ExpiryStatus status, BigDecimal costPrice) {
		BigDecimal factor = BigDecimal.ONE.subtract(discountPct.divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP));
		BigDecimal effectivePrice = basePrice.multiply(factor).setScale(2, RoundingMode.HALF_UP);
		return buildQuote(basePrice, discountPct.setScale(2, RoundingMode.HALF_UP), effectivePrice, daysLeft, status, costPrice);
	}

	private PriceQuote buildQuote(BigDecimal basePrice, BigDecimal discountPct, BigDecimal effectivePrice,
			long daysLeft, ExpiryStatus status, BigDecimal costPrice) {
		boolean belowCost = costPrice != null && effectivePrice.compareTo(costPrice) < 0;
		return new PriceQuote(
				basePrice.setScale(2, RoundingMode.HALF_UP),
				discountPct.setScale(2, RoundingMode.HALF_UP),
				effectivePrice.setScale(2, RoundingMode.HALF_UP),
				daysLeft,
				status,
				belowCost);
	}
}
