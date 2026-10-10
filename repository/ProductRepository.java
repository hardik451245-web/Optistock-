package com.optistock.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.optistock.entity.Product;

public interface ProductRepository extends JpaRepository<Product, Long> {

	List<Product> findByCategoryAndIdNot(String category, Long id);
}
