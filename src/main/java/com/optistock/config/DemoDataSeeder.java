package com.optistock.config;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.optistock.entity.Bill;
import com.optistock.entity.BillItem;
import com.optistock.entity.BillStatus;
import com.optistock.entity.Product;
import com.optistock.entity.User;
import com.optistock.repository.BillItemRepository;
import com.optistock.repository.BillRepository;
import com.optistock.repository.ProductRepository;
import com.optistock.repository.UserRepository;

@Component
@Profile("demo")
@Order(2)
public class DemoDataSeeder implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(DemoDataSeeder.class);

	private final ProductRepository productRepository;
	private final BillRepository billRepository;
	private final BillItemRepository billItemRepository;
	private final UserRepository userRepository;
	private final com.optistock.repository.SupplierRepository supplierRepository;
	private final com.optistock.repository.PurchaseOrderRepository purchaseOrderRepository;

	public DemoDataSeeder(ProductRepository productRepository, BillRepository billRepository,
			BillItemRepository billItemRepository, UserRepository userRepository,
			com.optistock.repository.SupplierRepository supplierRepository,
			com.optistock.repository.PurchaseOrderRepository purchaseOrderRepository) {
		this.productRepository = productRepository;
		this.billRepository = billRepository;
		this.billItemRepository = billItemRepository;
		this.userRepository = userRepository;
		this.supplierRepository = supplierRepository;
		this.purchaseOrderRepository = purchaseOrderRepository;
	}

	@Override
	@Transactional
	public void run(ApplicationArguments args) {
		LocalDate today = LocalDate.now(ZoneId.of("Asia/Kolkata"));
		seedSuppliersAndOrders(today);

		if (productRepository.count() > 0) {
			log.info("Products already exist; skipping product seeding in DemoDataSeeder");
			return;
		}

		log.info("Seeding demo data for today: {}", today);

		List<Product> products = new ArrayList<>();

		// 1. Vegetables (5)
		products.add(createProduct("Potato", "Fresh Farms", "Vegetables", "Potato", "20.00", "30.00", 0, 15, null));
		products.add(createProduct("Spinach", "Organic India", "Vegetables", "Spinach", "15.00", "25.00", 40, 10, today.plusDays(4)));
		products.add(createProduct("Tomato", "Fresh Farms", "Vegetables", "Tomato", "25.00", "40.00", 35, 10, today.plusDays(3)));
		products.add(createProduct("Onion", "FarmFresh", "Vegetables", "Onion", "22.00", "35.00", 80, 20, null));
		products.add(createProduct("Cauliflower", "Fresh Farms", "Vegetables", "Cauliflower", "28.00", "45.00", 50, 15, today.plusDays(6)));

		// 2. Fruits (5)
		products.add(createProduct("Apple", "Shimla", "Fruits", "Apple", "100.00", "150.00", 0, 10, today.plusDays(15)));
		products.add(createProduct("Alphonso Mango", "Ratnagiri", "Fruits", "Mango", "180.00", "260.00", 60, 15, today.plusDays(10)));
		products.add(createProduct("Banana", "Robusta", "Fruits", "Banana", "30.00", "50.00", 70, 20, today.plusDays(5)));
		products.add(createProduct("Orange", "Nagpur", "Fruits", "Orange", "50.00", "80.00", 45, 12, today.plusDays(8)));
		products.add(createProduct("Pomegranate", "Kashmiri", "Fruits", "Pomegranate", "110.00", "165.00", 35, 10, today.plusDays(12)));

		// 3. Dairy: Milk 1L, Curd 400g, Butter 100g pairs
		// Milk 1L pair (Amul vs Milky Mist)
		products.add(createProduct("Taaza Milk 1L", "Amul", "Dairy", "Milk 1L", "50.00", "64.00", 40, 10, today.plusDays(2)));
		products.add(createProduct("Fresh Milk 1L", "Milky Mist", "Dairy", "Milk 1L", "52.00", "62.00", 30, 10, today.plusDays(3)));
		// Curd 400g pair (Amul vs Milky Mist)
		products.add(createProduct("Masti Dahi 400g", "Amul", "Dairy", "Curd 400g", "30.00", "40.00", 25, 8, today.minusDays(1)));
		products.add(createProduct("Classic Curd 400g", "Milky Mist", "Dairy", "Curd 400g", "32.00", "45.00", 20, 8, today.plusDays(5)));
		// Butter 100g pair (Amul vs Nandini)
		products.add(createProduct("Pasteurized Butter 100g", "Amul", "Dairy", "Butter 100g", "42.00", "56.00", 35, 12, today.plusDays(25)));
		products.add(createProduct("Delicious Butter 100g", "Nandini", "Dairy", "Butter 100g", "40.00", "52.00", 30, 12, today.plusDays(20)));

		// 4. Bakery (5)
		products.add(createProduct("White Bread", "Modern", "Bakery", "Bread 400g", "22.00", "30.00", 20, 8, today));
		products.add(createProduct("Brown Bread", "Britannia", "Bakery", "Bread 400g", "28.00", "42.00", 22, 10, today.plusDays(1)));
		products.add(createProduct("Multigrain Bread", "English Oven", "Bakery", "Bread 400g", "35.00", "55.00", 18, 8, today.plusDays(2)));
		products.add(createProduct("Toastea Rusk", "Britannia", "Bakery", "Rusk", "32.00", "45.00", 60, 15, today.plusDays(60)));
		products.add(createProduct("Pav Buns", "Bonn", "Bakery", "Buns", "18.00", "25.00", 30, 10, today.plusDays(3)));

		// 5. Staples (5)
		products.add(createProduct("Basmati Rice", "India Gate", "Staples", "Rice", "85.00", "130.00", 80, 20, null));
		products.add(createProduct("Sunflower Oil", "Fortune", "Staples", "Cooking Oil", "110.00", "145.00", 75, 25, null));
		products.add(createProduct("Chakki Atta", "Aashirvaad", "Staples", "Wheat Flour", "40.00", "55.00", 90, 30, null));
		products.add(createProduct("Toor Dal", "Tata Sampann", "Staples", "Pulses", "120.00", "175.00", 65, 20, null));
		products.add(createProduct("Iodized Salt", "Tata", "Staples", "Salt", "20.00", "28.00", 120, 30, null));

		// 6. Snacks (5)
		products.add(createProduct("Aloo Bhujia", "Haldiram's", "Snacks", "Bhujia", "42.00", "60.00", 75, 20, null));
		products.add(createProduct("Magic Masala Chips", "Lay's", "Snacks", "Potato Chips", "15.00", "20.00", 100, 30, null));
		products.add(createProduct("Salted Wafers", "Balaji", "Snacks", "Potato Chips", "14.00", "20.00", 85, 25, null));
		products.add(createProduct("Masala Munch", "Kurkure", "Snacks", "Corn Puffs", "15.00", "20.00", 90, 25, null));
		products.add(createProduct("Gulab Jamun Tin", "Bikaji", "Snacks", "Sweets", "130.00", "190.00", 40, 10, today.plusDays(90)));

		// 7. Beverages (5)
		products.add(createProduct("Tea Gold", "Tata", "Beverages", "Tea Powder", "115.00", "150.00", 5, 15, null));
		products.add(createProduct("Red Label Tea", "Brooke Bond", "Beverages", "Tea Powder", "110.00", "140.00", 55, 15, null));
		products.add(createProduct("Classic Coffee", "Nescafe", "Beverages", "Coffee", "140.00", "195.00", 45, 12, null));
		products.add(createProduct("Mixed Fruit Juice", "Real", "Beverages", "Fruit Juice", "85.00", "120.00", 40, 12, today.plusDays(45)));
		products.add(createProduct("Mango Drink", "Frooti", "Beverages", "Fruit Juice", "30.00", "42.00", 80, 20, today.plusDays(60)));

		// 8. Personal Care (5)
		products.add(createProduct("Original Soap", "Dettol", "Personal Care", "Bath Soap", "32.00", "45.00", 90, 25, null));
		products.add(createProduct("Beauty Bathing Bar", "Dove", "Personal Care", "Bath Soap", "48.00", "68.00", 70, 20, null));
		products.add(createProduct("Strong Teeth Toothpaste", "Colgate", "Personal Care", "Toothpaste", "75.00", "105.00", 80, 20, null));
		products.add(createProduct("Pure Coconut Oil", "Parachute", "Personal Care", "Hair Oil", "80.00", "115.00", 65, 15, null));
		products.add(createProduct("Anti-Dandruff Shampoo", "Head & Shoulders", "Personal Care", "Shampoo", "140.00", "199.00", 50, 15, null));

		products = productRepository.saveAll(products);
		log.info("Saved {} demo products", products.size());

		// Cashier user
		Long cashierId = userRepository.findAll().stream()
				.filter(u -> u.getRole() == com.optistock.entity.Role.CASHIER)
				.map(User::getId)
				.findFirst()
				.orElse(1L);

		// Generate 30 days of realistic COMPLETED bills
		Random random = new Random(42);
		List<Product> vegetableProducts = products.stream()
				.filter(p -> "Vegetables".equals(p.getCategory()))
				.collect(java.util.stream.Collectors.toList());
		List<Product> otherProducts = products.stream()
				.filter(p -> !"Vegetables".equals(p.getCategory()) && p.getSellingPrice() != null)
				.collect(java.util.stream.Collectors.toList());

		for (int daysAgo = 30; daysAgo >= 0; daysAgo--) {
			LocalDate billDate = today.minusDays(daysAgo);
			boolean isWeekend = billDate.getDayOfWeek() == DayOfWeek.SATURDAY || billDate.getDayOfWeek() == DayOfWeek.SUNDAY;
			int billCount = isWeekend ? (4 + random.nextInt(3)) : (2 + random.nextInt(3));

			for (int b = 0; b < billCount; b++) {
				LocalDateTime billTime = billDate.atTime(10 + random.nextInt(10), random.nextInt(60));

				Bill bill = new Bill();
				bill.setCashierId(cashierId);
				bill.setStatus(BillStatus.COMPLETED);
				bill.setCreatedAt(billTime);
				bill.setTotalAmount(BigDecimal.ZERO);
				bill.setSubtotal(BigDecimal.ZERO);
				bill.setTotalDiscount(BigDecimal.ZERO);
				bill = billRepository.save(bill);

				BigDecimal subtotal = BigDecimal.ZERO;
				BigDecimal totalCharged = BigDecimal.ZERO;

				int itemCount = 2 + random.nextInt(4);
				for (int i = 0; i < itemCount; i++) {
					Product prod;
					// Vegetables sell more on weekends: higher chance of selecting vegetable product
					if (isWeekend && random.nextDouble() < 0.65 && !vegetableProducts.isEmpty()) {
						prod = vegetableProducts.get(random.nextInt(vegetableProducts.size()));
					} else {
						prod = otherProducts.get(random.nextInt(otherProducts.size()));
					}

					// Skip 0 stock products for realistic historical items
					int qty = 1 + random.nextInt(isWeekend && "Vegetables".equals(prod.getCategory()) ? 4 : 2);
					BigDecimal basePrice = prod.getSellingPrice();
					BigDecimal lineOriginal = basePrice.multiply(BigDecimal.valueOf(qty)).setScale(2, RoundingMode.HALF_UP);
					BigDecimal lineCharged = lineOriginal;

					subtotal = subtotal.add(lineOriginal);
					totalCharged = totalCharged.add(lineCharged);

					BillItem item = new BillItem();
					item.setBillId(bill.getId());
					item.setProductId(prod.getId());
					item.setQuantity(qty);
					item.setPrice(basePrice);
					item.setOriginalPrice(basePrice);
					item.setDiscountPercent(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
					item.setDiscountReason(null);
					item.setBelowCost(false);
					billItemRepository.save(item);
				}

				bill.setSubtotal(subtotal);
				bill.setTotalDiscount(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
				bill.setTotalAmount(totalCharged);
				billRepository.save(bill);
			}
		}

		// Plus 2 CANCELLED bills
		for (int c = 1; c <= 2; c++) {
			LocalDateTime cancelTime = today.minusDays(c * 2).atTime(14, 30);
			Bill cancelledBill = new Bill();
			cancelledBill.setCashierId(cashierId);
			cancelledBill.setStatus(BillStatus.CANCELLED);
			cancelledBill.setCreatedAt(cancelTime);
			cancelledBill.setCancelledAt(cancelTime.plusMinutes(15));
			cancelledBill.setSubtotal(new BigDecimal("150.00"));
			cancelledBill.setTotalDiscount(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
			cancelledBill.setTotalAmount(new BigDecimal("150.00"));
			cancelledBill = billRepository.save(cancelledBill);

			BillItem item = new BillItem();
			item.setBillId(cancelledBill.getId());
			item.setProductId(products.get(2).getId());
			item.setQuantity(3);
			item.setPrice(new BigDecimal("50.00"));
			item.setOriginalPrice(new BigDecimal("50.00"));
			item.setDiscountPercent(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
			item.setDiscountReason(null);
			item.setBelowCost(false);
			billItemRepository.save(item);
		}

		log.info("DemoDataSeeder completed successfully: 40 products and realistic bill history seeded.");
	}

	private Product createProduct(String name, String brand, String category, String productType,
			String costPrice, String sellingPrice, int stock, int reorderThreshold, LocalDate expiryDate) {
		Product p = new Product();
		p.setName(name);
		p.setBrand(brand);
		p.setCategory(category);
		p.setProductType(productType);
		p.setCostPrice(new BigDecimal(costPrice).setScale(2, RoundingMode.HALF_UP));
		p.setSellingPrice(new BigDecimal(sellingPrice).setScale(2, RoundingMode.HALF_UP));
		p.setStockQuantity(stock);
		p.setReorderThreshold(reorderThreshold);
		p.setExpiryDate(expiryDate);
		return p;
	}

	private void seedSuppliersAndOrders(LocalDate today) {
		if (supplierRepository.count() == 0) {
			supplierRepository.save(new com.optistock.entity.Supplier(
					"Kisan Fresh Agro", "Ramesh Patel", "+91 98201 12345", "919820112345",
					"orders@kisanagro.com", "Vashi APMC Market, Navi Mumbai", "Vegetables & Fruits"));
			supplierRepository.save(new com.optistock.entity.Supplier(
					"Amul Dairy Cooperative", "Vikram Shah", "+91 98202 23456", "919820223456",
					"supply@amuldairy.com", "Anand Dairy Estate, Gujarat", "Dairy"));
			supplierRepository.save(new com.optistock.entity.Supplier(
					"Modern Bakery & Foods", "Anil Verma", "+91 98203 34567", "919820334567",
					"b2b@modernbakers.com", "Andheri East, Mumbai", "Bakery"));
			supplierRepository.save(new com.optistock.entity.Supplier(
					"Metro Wholesale FMCG", "Pooja Mehta", "+91 98204 45678", "919820445678",
					"wholesale@metrofmcg.in", "Bhiwandi Logistics Park, Thane", "Staples & FMCG"));
			supplierRepository.save(new com.optistock.entity.Supplier(
					"Haldiram Snacks Hub", "Sanjay Gupta", "+91 98205 56789", "919820556789",
					"distributor@haldiramshub.com", "Nagpur Industrial Area", "Snacks & Beverages"));
			log.info("Seeded 5 default suppliers");
		}
	}
}
