import React, { useEffect, useState } from "react";
import { useAuthenticatedFetch } from "../hooks";
import {
  Card,
  DataTable,
  Pagination,
  Spinner,
  TextField,
} from "@shopify/polaris";

const ProductsList = () => {
  const fetch = useAuthenticatedFetch();
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]); // For filtered products
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(20);
  const [searchQuery, setSearchQuery] = useState("");

  const getProductsList = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/get-products");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setProducts(data);
      setFilteredProducts(data); // Initialize with the full product list
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getProductsList();
  }, []);

  // Handle search
  const handleSearchChange = (value) => {
    setSearchQuery(value);
    const filtered = products.filter((product) =>
      product.title.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredProducts(filtered);
    setCurrentPage(1); // Reset to the first page
  };

  const handleNextPage = () => {
    if (currentPage < Math.ceil(filteredProducts.length / productsPerPage)) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Calculate paginated products
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(
    indexOfFirstProduct,
    indexOfLastProduct
  );

  // Map the product data for the table
  const rows = currentProducts.map((product) => [
    <img
      src={product.images[0]?.src || "https://via.placeholder.com/50"}
      alt={product.images[0]?.alt || "No image"}
      style={{ width: "50px", height: "50px", objectFit: "cover" }}
    />,
    product.title,
    product.product_type,
    product.vendor,
    `$${product.variants[0]?.price || "N/A"}`,
    product.status,
    product.variants[0]?.barcode ?? "N/A",
    product.tags ?? "N/A",
  ]);
  // console.log(products[0].tags)
  return (
    <Card>
      {isLoading ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "200px",
          }}
        >
          <Spinner accessibilityLabel="Loading products" size="large" />
        </div>
      ) : (
        <>
        <div style={{padding:"20px"}}>
          <TextField
            label="Search by Title"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Enter product title"
            clearButton
            onClearButtonClick={() => handleSearchChange("")}
          />
          </div>
          <DataTable
            columnContentTypes={[
              "text",
              "text",
              "text",
              "text",
              "text",
              "text",
            ]}
            headings={[
              "Image",
              "Title",
              "Type",
              "Vendor",
              "Price",
              "Status",
              "Barcode",
              "Tags",
            ]}
            rows={rows}
          />
          <div
            style={{
              marginTop: "20px",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Pagination
              hasPrevious={currentPage > 1}
              onPrevious={handlePreviousPage}
              hasNext={
                currentPage <
                Math.ceil(filteredProducts.length / productsPerPage)
              }
              onNext={handleNextPage}
            />
          </div>
        </>
      )}
    </Card>
  );
};

export default ProductsList;
