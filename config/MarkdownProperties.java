package com.optistock.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "optistock.markdown")
public class MarkdownProperties {

	private int expiringSoonUpper = 4;
	private int expiringSoonLower = 3;
	private int markdownUpper = 2;
	private int markdownLower = 1;
	private int markdownDiscount = 50;
	private int lastDayDiscount = 70;

	public int getExpiringSoonUpper() {
		return expiringSoonUpper;
	}

	public void setExpiringSoonUpper(int expiringSoonUpper) {
		this.expiringSoonUpper = expiringSoonUpper;
	}

	public int getExpiringSoonLower() {
		return expiringSoonLower;
	}

	public void setExpiringSoonLower(int expiringSoonLower) {
		this.expiringSoonLower = expiringSoonLower;
	}

	public int getMarkdownUpper() {
		return markdownUpper;
	}

	public void setMarkdownUpper(int markdownUpper) {
		this.markdownUpper = markdownUpper;
	}

	public int getMarkdownLower() {
		return markdownLower;
	}

	public void setMarkdownLower(int markdownLower) {
		this.markdownLower = markdownLower;
	}

	public int getMarkdownDiscount() {
		return markdownDiscount;
	}

	public void setMarkdownDiscount(int markdownDiscount) {
		this.markdownDiscount = markdownDiscount;
	}

	public int getLastDayDiscount() {
		return lastDayDiscount;
	}

	public void setLastDayDiscount(int lastDayDiscount) {
		this.lastDayDiscount = lastDayDiscount;
	}
}
