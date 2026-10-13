package com.optistock.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.optistock.entity.DiscountRequest;
import com.optistock.entity.DiscountRequestStatus;

public interface DiscountRequestRepository extends JpaRepository<DiscountRequest, Long> {

	List<DiscountRequest> findByStatus(DiscountRequestStatus status);

	List<DiscountRequest> findByCashierIdAndProductIdAndStatusAndRequestedPercent(
			Long cashierId, Long productId, DiscountRequestStatus status, java.math.BigDecimal requestedPercent);
}
