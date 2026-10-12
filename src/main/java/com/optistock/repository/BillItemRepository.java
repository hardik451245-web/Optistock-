package com.optistock.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.optistock.entity.BillItem;

public interface BillItemRepository extends JpaRepository<BillItem, Long> {

	List<BillItem> findByBillId(Long billId);

	boolean existsByProductId(Long productId);

	@Query(value = "SELECT bi.product_id, COALESCE(SUM(bi.quantity), 0) " +
			"FROM bill_items bi INNER JOIN bills b ON bi.bill_id = b.id " +
			"WHERE b.created_at >= :from AND b.created_at < :to AND b.status = 'COMPLETED' " +
			"GROUP BY bi.product_id", nativeQuery = true)
	List<Object[]> sumQuantityByProductBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

	@Query(value = "SELECT bi.product_id, COALESCE(SUM(bi.quantity), 0) AS qty_sold, " +
			"COALESCE(SUM(bi.price * bi.quantity), 0) AS revenue " +
			"FROM bill_items bi INNER JOIN bills b ON bi.bill_id = b.id " +
			"WHERE b.created_at >= :from AND b.created_at < :to AND b.status = 'COMPLETED' " +
			"GROUP BY bi.product_id", nativeQuery = true)
	List<Object[]> salesByProductBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

	@Query(value = "SELECT COALESCE(SUM(bi.quantity), 0) " +
			"FROM bill_items bi INNER JOIN bills b ON bi.bill_id = b.id " +
			"WHERE b.created_at >= :from AND b.created_at < :to AND b.status = 'COMPLETED'", nativeQuery = true)
	long totalItemsSold(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

	@Query(value = "SELECT COALESCE(SUM(bi.original_price * bi.quantity), 0) " +
			"FROM bill_items bi INNER JOIN bills b ON bi.bill_id = b.id " +
			"WHERE b.created_at >= :from AND b.created_at < :to AND b.status = 'COMPLETED'", nativeQuery = true)
	java.math.BigDecimal totalGrossSales(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

	@Query(value = "SELECT COALESCE(SUM((bi.original_price - bi.price) * bi.quantity), 0) " +
			"FROM bill_items bi INNER JOIN bills b ON bi.bill_id = b.id " +
			"WHERE b.created_at >= :from AND b.created_at < :to AND b.status = 'COMPLETED'", nativeQuery = true)
	java.math.BigDecimal totalDiscountGiven(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

	@Query(value = "SELECT COALESCE(SUM(bi.price * bi.quantity), 0) " +
			"FROM bill_items bi INNER JOIN bills b ON bi.bill_id = b.id " +
			"WHERE b.created_at >= :from AND b.created_at < :to AND b.status = 'COMPLETED' " +
			"AND bi.discount_percent > 0", nativeQuery = true)
	java.math.BigDecimal markdownSalesAmount(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

	@Query(value = "SELECT COUNT(*) " +
			"FROM bill_items bi INNER JOIN bills b ON bi.bill_id = b.id " +
			"WHERE b.created_at >= :from AND b.created_at < :to AND b.status = 'COMPLETED' " +
			"AND bi.below_cost = true", nativeQuery = true)
	long belowCostItemCount(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

	@Query(value = "SELECT p.name, SUM(bi.quantity) AS qty_sold, SUM(bi.price * bi.quantity) AS revenue " +
			"FROM bill_items bi INNER JOIN bills b ON bi.bill_id = b.id " +
			"INNER JOIN products p ON bi.product_id = p.id " +
			"WHERE b.created_at >= :from AND b.created_at < :to AND b.status = 'COMPLETED' " +
			"GROUP BY p.id, p.name ORDER BY revenue DESC LIMIT 5", nativeQuery = true)
	List<Object[]> top5Products(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

	@Query(value = "SELECT p.id, p.name, p.brand, p.category, p.cost_price, " +
			"SUM(bi.quantity) AS qty_sold, SUM(bi.price * bi.quantity) AS revenue, " +
			"SUM((bi.price - p.cost_price) * bi.quantity) AS profit " +
			"FROM bill_items bi INNER JOIN bills b ON bi.bill_id = b.id " +
			"INNER JOIN products p ON bi.product_id = p.id " +
			"WHERE b.created_at >= :from AND b.created_at < :to AND b.status = 'COMPLETED' " +
			"GROUP BY p.id, p.name, p.brand, p.category, p.cost_price " +
			"ORDER BY profit DESC", nativeQuery = true)
	List<Object[]> rankingByProfit(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);
}
