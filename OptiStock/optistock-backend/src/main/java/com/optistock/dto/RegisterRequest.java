package com.optistock.dto;

import com.optistock.entity.Role;

public class RegisterRequest {

	private String name;
	private String email;
	private String password;
	private Role role;
	private String managerCode;

	public RegisterRequest() {
	}

	public RegisterRequest(String name, String email, String password, Role role, String managerCode) {
		this.name = name;
		this.email = email;
		this.password = password;
		this.role = role;
		this.managerCode = managerCode;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public String getPassword() {
		return password;
	}

	public void setPassword(String password) {
		this.password = password;
	}

	public Role getRole() {
		return role;
	}

	public void setRole(Role role) {
		this.role = role;
	}

	public String getManagerCode() {
		return managerCode;
	}

	public void setManagerCode(String managerCode) {
		this.managerCode = managerCode;
	}
}
