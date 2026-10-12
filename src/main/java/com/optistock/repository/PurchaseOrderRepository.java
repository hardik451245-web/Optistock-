package com.optistock.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.optistock.entity.PurchaseOrder;
import com.optistock.entity.PurchaseOrderStatus;

public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, Long> {

	List<PurchaseOrder> findAllByOrderByOrderedAtDesc();

	List<PurchaseOrder> findByStatusOrderByOrderedAtDesc(PurchaseOrderStatus status);

	@Query("SELECT po.productId, COALESCE(SUM(po.quantity), 0) FROM PurchaseOrder po WHERE po.status = com.optistock.entity.PurchaseOrderStatus.ORDERED GROUP BY po.productId")
	List<Object[]> sumOrderedQuantityGroupByProductId();

	@Query("SELECT COALESCE(SUM(po.quantity), 0) FROM PurchaseOrder po WHERE po.productId = :productId AND po.status = com.optistock.entity.PurchaseOrderStatus.ORDERED")
	int sumOrderedQuantityByProductId(@Param("productId") Long productId);
}
