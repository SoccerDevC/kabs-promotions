"use client"

import { useState } from "react"
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Image, Dimensions, Modal, ScrollView } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"

const { width } = Dimensions.get("window")

const ShopScreen = () => {
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [cartItems, setCartItems] = useState([])

  const categories = ["All", "Apparel", "Accessories", "Music", "Collectibles", "Digital"]

  // Sample products
  const products = [
    {
      id: "1",
      name: "Kabs T-Shirt",
      category: "Apparel",
      price: 24.99,
      image: "https://img.icons8.com/color/96/000000/t-shirt.png",
      description: "Official Kabs Promotions t-shirt featuring our logo on premium cotton.",
      sizes: ["S", "M", "L", "XL"],
      colors: ["Black", "White", "Red"],
    },
    {
      id: "2",
      name: "Kabs Cap",
      category: "Accessories",
      price: 19.99,
      image: "https://img.icons8.com/color/96/000000/cap.png",
      description: "Stylish cap with embroidered Kabs logo. One size fits all.",
      colors: ["Black", "Red", "Blue"],
    },
    {
      id: "3",
      name: "Kabs Album",
      category: "Music",
      price: 12.99,
      image: "https://img.icons8.com/color/96/000000/cd.png",
      description: "Latest compilation album featuring top artists from Kabs Radio.",
      format: ["CD", "Digital Download"],
    },
    {
      id: "4",
      name: "Kabs Mug",
      category: "Collectibles",
      price: 14.99,
      image: "https://img.icons8.com/color/96/000000/mug.png",
      description: "Ceramic mug with Kabs Promotions logo. Dishwasher safe.",
      colors: ["White", "Black"],
    },
    {
      id: "5",
      name: "Digital Gift Card",
      category: "Digital",
      price: 25.0,
      image: "https://img.icons8.com/color/96/000000/gift-card.png",
      description: "Digital gift card that can be used on any Kabs product or service.",
      values: ["$25", "$50", "$100"],
    },
    {
      id: "6",
      name: "Kabs Hoodie",
      category: "Apparel",
      price: 39.99,
      image: "https://img.icons8.com/color/96/000000/hoodie.png",
      description: "Warm and comfortable hoodie with Kabs logo. Perfect for casual wear.",
      sizes: ["S", "M", "L", "XL"],
      colors: ["Black", "Gray", "Red"],
    },
  ]

  const filteredProducts =
    selectedCategory === "All" ? products : products.filter((product) => product.category === selectedCategory)

  const addToCart = (product) => {
    setCartItems([...cartItems, product])
    setModalVisible(false)
  }

  const renderCategory = ({ item }) => (
    <TouchableOpacity
      style={[styles.categoryTab, selectedCategory === item && styles.activeCategoryTab]}
      onPress={() => setSelectedCategory(item)}
    >
      <Text style={[styles.categoryName, selectedCategory === item && styles.activeCategoryName]}>{item}</Text>
    </TouchableOpacity>
  )

  const renderProduct = ({ item }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => {
        setSelectedProduct(item)
        setModalVisible(true)
      }}
    >
      <Image source={{ uri: item.image }} style={styles.productImage} />
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productCategory}>{item.category}</Text>
        <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
      </View>
      <TouchableOpacity style={styles.addButton} onPress={() => addToCart(item)}>
        <Ionicons name="add-circle" size={24} color="#FFD700" />
      </TouchableOpacity>
    </TouchableOpacity>
  )

  return (
    <LinearGradient colors={["#8B0000", "#800080"]} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Kabs Shop</Text>
        <Text style={styles.headerSubtitle}>Browse exclusive merchandise</Text>
        <TouchableOpacity style={styles.cartButton}>
          <Ionicons name="cart" size={24} color="#FFFFFF" />
          {cartItems.length > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartItems.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.categoryTabs}>
        <FlatList
          data={categories}
          renderItem={renderCategory}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
        />
      </View>

      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.productsList}
        numColumns={2}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        {selectedProduct && (
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <TouchableOpacity style={styles.closeModalButton} onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#8B0000" />
              </TouchableOpacity>

              <ScrollView>
                <Image source={{ uri: selectedProduct.image }} style={styles.modalImage} />
                <Text style={styles.modalTitle}>{selectedProduct.name}</Text>
                <Text style={styles.modalCategory}>{selectedProduct.category}</Text>
                <Text style={styles.modalPrice}>${selectedProduct.price.toFixed(2)}</Text>
                <Text style={styles.modalDescription}>{selectedProduct.description}</Text>

                {selectedProduct.sizes && (
                  <View style={styles.optionSection}>
                    <Text style={styles.optionTitle}>Sizes:</Text>
                    <View style={styles.optionsRow}>
                      {selectedProduct.sizes.map((size, index) => (
                        <TouchableOpacity key={index} style={styles.optionButton}>
                          <Text style={styles.optionText}>{size}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {selectedProduct.colors && (
                  <View style={styles.optionSection}>
                    <Text style={styles.optionTitle}>Colors:</Text>
                    <View style={styles.optionsRow}>
                      {selectedProduct.colors.map((color, index) => (
                        <TouchableOpacity key={index} style={styles.optionButton}>
                          <Text style={styles.optionText}>{color}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {selectedProduct.format && (
                  <View style={styles.optionSection}>
                    <Text style={styles.optionTitle}>Format:</Text>
                    <View style={styles.optionsRow}>
                      {selectedProduct.format.map((format, index) => (
                        <TouchableOpacity key={index} style={styles.optionButton}>
                          <Text style={styles.optionText}>{format}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {selectedProduct.values && (
                  <View style={styles.optionSection}>
                    <Text style={styles.optionTitle}>Value:</Text>
                    <View style={styles.optionsRow}>
                      {selectedProduct.values.map((value, index) => (
                        <TouchableOpacity key={index} style={styles.optionButton}>
                          <Text style={styles.optionText}>{value}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                <TouchableOpacity style={styles.addToCartButton} onPress={() => addToCart(selectedProduct)}>
                  <Text style={styles.addToCartText}>Add to Cart</Text>
                  <Ionicons name="cart" size={20} color="#8B0000" />
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        )}
      </Modal>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop:20
  },
  header: {
    padding: 15,
    alignItems: "center",
    flexDirection: "row",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    flex: 1,
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#FFFFFF",
    opacity: 0.8,
    position: "absolute",
    top: 45,
    alignSelf: "center",
  },
  cartButton: {
    position: "absolute",
    right: 15,
    top: 15,
  },
  cartBadge: {
    position: "absolute",
    right: -5,
    top: -5,
    backgroundColor: "#FFD700",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  cartBadgeText: {
    color: "#8B0000",
    fontSize: 12,
    fontWeight: "bold",
  },
  categoryTabs: {
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    paddingVertical: 10,
    marginTop: 20,
  },
  categoryTab: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  activeCategoryTab: {
    backgroundColor: "#FFD700",
  },
  categoryName: {
    color: "#FFFFFF",
    fontWeight: "500",
  },
  activeCategoryName: {
    color: "#8B0000",
  },
  productsList: {
    padding: 10,
  },
  productCard: {
    width: (width - 30) / 2,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 10,
    margin: 5,
    padding: 10,
    alignItems: "center",
  },
  productImage: {
    width: 80,
    height: 80,
    marginBottom: 10,
  },
  productInfo: {
    alignItems: "center",
  },
  productName: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 5,
  },
  productCategory: {
    color: "#FFFFFF",
    opacity: 0.8,
    fontSize: 12,
    marginBottom: 5,
  },
  productPrice: {
    color: "#FFD700",
    fontWeight: "bold",
    fontSize: 16,
  },
  addButton: {
    position: "absolute",
    bottom: 10,
    right: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 20,
    position: "relative",
  },
  closeModalButton: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 1,
  },
  modalImage: {
    width: 120,
    height: 120,
    alignSelf: "center",
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#8B0000",
    textAlign: "center",
    marginBottom: 5,
  },
  modalCategory: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 5,
  },
  modalPrice: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#8B0000",
    textAlign: "center",
    marginBottom: 15,
  },
  modalDescription: {
    fontSize: 16,
    color: "#333",
    marginBottom: 20,
    lineHeight: 22,
  },
  optionSection: {
    marginBottom: 15,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#8B0000",
    marginBottom: 8,
  },
  optionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  optionButton: {
    backgroundColor: "rgba(139, 0, 0, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
  },
  optionText: {
    color: "#8B0000",
  },
  addToCartButton: {
    backgroundColor: "#FFD700",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 10,
  },
  addToCartText: {
    color: "#8B0000",
    fontWeight: "bold",
    fontSize: 16,
    marginRight: 8,
  },
})

export default ShopScreen

