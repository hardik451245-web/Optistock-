package com.optistock.exception;

public class ProfitWarningException extends RuntimeException {

	private final String code = "PROFIT_WARNING";

	public ProfitWarningException(String message) {
		super(message);
	}

	public String getCode() {
		return code;
	}
}
