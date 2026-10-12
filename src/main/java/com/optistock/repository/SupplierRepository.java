package com.optistock.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.optistock.entity.Supplier;

@Repository
public interface SupplierRepository extends JpaRepository<Supplier, Long> {
	List<Supplier> findAllByOrderByNameAsc();
}
