package com.optistock.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.optistock.dto.BulkPurchaseOrderItem;
import com.optistock.dto.CreatePurchaseOrderRequest;
import com.optistock.dto.PurchaseOrderResponse;
import com.optistock.dto.ReceivePurchaseOrderRequest;
import com.optistock.entity.PurchaseOrderStatus;
import com.optistock.service.PurchaseOrderService;

@RestController
@RequestMapping("/api/purchase-orders")
public class PurchaseOrderController {

	private final PurchaseOrderService purchaseOrderService;

	public PurchaseOrderController(PurchaseOrderService purchaseOrderService) {
		this.purchaseOrderService = purchaseOrderService;
	}

	@PostMapping
	public ResponseEntity<PurchaseOrderResponse> createOrder(
			@RequestBody CreatePurchaseOrderRequest request,
			Authentication authentication) {
		String orderedBy = authentication != null ? authentication.getName() : "Manager";
		return ResponseEntity.status(HttpStatus.CREATED)
				.body(purchaseOrderService.createOrder(request, orderedBy));
	}

	@PostMapping("/bulk")
	public ResponseEntity<List<PurchaseOrderResponse>> createBulkOrders(
			@RequestBody List<BulkPurchaseOrderItem> items,
			Authentication authentication) {
		String orderedBy = authentication != null ? authentication.getName() : "Manager";
		return ResponseEntity.status(HttpStatus.CREATED)
				.body(purchaseOrderService.createBulkOrders(items, orderedBy));
	}

	@GetMapping
	public ResponseEntity<List<PurchaseOrderResponse>> listOrders(
			@RequestParam(required = false) PurchaseOrderStatus status) {
		return ResponseEntity.ok(purchaseOrderService.listOrders(status));
	}

	@PutMapping("/{id}/receive")
	public ResponseEntity<PurchaseOrderResponse> receiveOrder(
			@PathVariable Long id,
			@RequestBody(required = false) ReceivePurchaseOrderRequest request,
			Authentication authentication) {
		String receivedBy = authentication != null ? authentication.getName() : "Manager";
		return ResponseEntity.ok(purchaseOrderService.receiveOrder(id, request, receivedBy));
	}

	@PostMapping("/suggest")
	public ResponseEntity<PurchaseOrderResponse> suggestOrder(
			@RequestBody CreatePurchaseOrderRequest request,
			Authentication authentication) {
		request.setIsSuggested(true);
		String orderedBy = authentication != null ? authentication.getName() : "Manager";
		return ResponseEntity.status(HttpStatus.CREATED)
				.body(purchaseOrderService.createOrder(request, orderedBy));
	}

	@PutMapping("/{id}/approve")
	public ResponseEntity<PurchaseOrderResponse> approveOrder(
			@PathVariable Long id,
			@RequestParam(required = false) Long supplierId,
			@RequestBody(required = false) CreatePurchaseOrderRequest request,
			Authentication authentication) {
		String approvedBy = authentication != null ? authentication.getName() : "Manager";
		Long finalSupplierId = request != null && request.getSupplierId() != null ? request.getSupplierId() : supplierId;
		return ResponseEntity.ok(purchaseOrderService.approveOrder(id, finalSupplierId, approvedBy));
	}

	@PutMapping("/{id}/mark-ordered")
	public ResponseEntity<PurchaseOrderResponse> markOrdered(
			@PathVariable Long id,
			@RequestParam(required = false, defaultValue = "MANUAL") String channel,
			Authentication authentication) {
		String orderedBy = authentication != null ? authentication.getName() : "Manager";
		return ResponseEntity.ok(purchaseOrderService.markOrdered(id, channel, orderedBy));
	}

	@PutMapping("/{id}/cancel")
	public ResponseEntity<PurchaseOrderResponse> cancelOrder(@PathVariable Long id) {
		return ResponseEntity.ok(purchaseOrderService.cancelOrder(id));
	}
}
