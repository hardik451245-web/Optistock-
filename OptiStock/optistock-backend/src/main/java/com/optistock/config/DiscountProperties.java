package com.optistock.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "optistock.discount")
public class DiscountProperties {

	private int minMarginPercent = 10;

	public int getMinMarginPercent() {
		return minMarginPercent;
	}

	public void setMinMarginPercent(int minMarginPercent) {
		this.minMarginPercent = minMarginPercent;
	}
}
