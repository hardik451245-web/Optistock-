package com.optistock.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.optistock.dto.ProductRequest;
import com.optistock.dto.ProductResponse;
import com.optistock.service.ProductService;

@RestController
@RequestMapping("/api/products")
public class ProductController {

	private final ProductService productService;

	public ProductController(ProductService productService) {
		this.productService = productService;
	}

	@GetMapping
	public List<ProductResponse> listProducts() {
		return productService.listProducts();
	}

	@GetMapping("/{id}")
	public ProductResponse getProduct(@PathVariable Long id) {
		return productService.getProduct(id);
	}

	@PostMapping
	public ResponseEntity<ProductResponse> addProduct(@RequestBody ProductRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(productService.addProduct(request));
	}

	@PutMapping("/{id}")
	public ProductResponse updateProduct(@PathVariable Long id, @RequestBody ProductRequest request) {
		return productService.updateProduct(id, request);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
		productService.deleteProduct(id);
		return ResponseEntity.noContent().build();
	}

	@GetMapping("/{id}/alternatives")
	public List<ProductResponse> getAlternatives(@PathVariable Long id) {
		return productService.findAlternatives(id);
	}
}
