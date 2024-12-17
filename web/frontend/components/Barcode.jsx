import React, { useEffect, useState, useCallback } from "react";
import { useAuthenticatedFetch } from "../hooks";
import {
  Card,
  DataTable,
  Pagination,
  Spinner,
  Button,
  TextField,
  Toast,
} from "@shopify/polaris";

const Barcode = () => {
  const fetch = useAuthenticatedFetch();

  const [isLoading, setIsLoading] = useState(false);
  const [isUpdatingBarcodes, setIsUpdatingBarcodes] = useState(false);
  const [barcodes, setBarcodes] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [toast, setToast] = useState({ active: false, content: "" });
  const [updatingBarcodeId, setUpdatingBarcodeId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredBarcodes, setFilteredBarcodes] = useState([]);

  const debounce = (func, delay) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), delay);
    };
  };

  const getBarcodesList = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/gtins/get");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setBarcodes(data);
      setFilteredBarcodes(data); // Initialize filtered data
    } catch (error) {
      console.error("Error fetching barcodes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateBareCodes = async () => {
    setIsUpdatingBarcodes(true);
    try {
      const response = await fetch("/api/update-barecode");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log(data);
      setToast({ active: true, content: "Barcodes updated successfully!" });
    } catch (error) {
      console.error("Error updating barcodes:", error);
      setToast({ active: true, content: "Failed to update barcodes." });
    } finally {
      setIsUpdatingBarcodes(false);
    }
  };

  const handleSearch = useCallback(
    debounce((term) => {
      const lowerTerm = term.toLowerCase();
      const filtered = barcodes.filter((barcode) =>
        [barcode.handle, barcode.option1value, barcode.variantBarcode]
          .map((value) => (value ? value.toLowerCase() : ""))
          .some((field) => field.includes(lowerTerm))
      );
      setFilteredBarcodes(filtered);
    }, 300),
    [barcodes]
  );

  useEffect(() => {
    getBarcodesList();
  }, []);

  useEffect(() => {
    handleSearch(searchTerm);
  }, [searchTerm, handleSearch]);

  const handleNextPage = () => {
    if (currentPage < Math.ceil(filteredBarcodes.length / itemsPerPage)) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleBarcodeChange = (id, value) => {
    setBarcodes((prevBarcodes) =>
      prevBarcodes.map((barcode) =>
        barcode.id === id ? { ...barcode, variantBarcode: value } : barcode
      )
    );
  };

  const handleUpdateBarcode = async (id) => {
    setUpdatingBarcodeId(id);
    const barcodeToUpdate = barcodes.find((barcode) => barcode.id === id);

    try {
      const response = await fetch(`/api/gtins/update/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(barcodeToUpdate),
      });

      if (response.ok) {
        setToast({ active: true, content: "Barcode updated successfully!" });
      } else {
        throw new Error(`Failed to update barcode with ID ${id}`);
      }
    } catch (error) {
      console.error("Error updating barcode:", error);
      setToast({ active: true, content: "Failed to update barcode." });
    } finally {
      setUpdatingBarcodeId(null);
    }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentBarcodes = filteredBarcodes.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const rows = currentBarcodes.map((barcode) => [
    barcode.id,
    <div
      style={{
        maxWidth: "200px",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}
    >
      {barcode.handle || "N/A"}
    </div>,
    barcode.option1value || "N/A",
    <TextField
      value={barcode.variantBarcode || ""}
      onChange={(value) => handleBarcodeChange(barcode.id, value)}
      placeholder="Enter barcode"
    />,
    <Button
      onClick={() => {
        handleUpdateBarcode(barcode.id);
      }}
      size="slim"
      primary
      loading={updatingBarcodeId === barcode.id}
    >
      Update
    </Button>,
  ]);

  return (
    <>
      {toast.active && (
        <Toast
          content={toast.content}
          onDismiss={() => setToast({ active: false, content: "" })}
        />
      )}
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
            <Spinner accessibilityLabel="Loading barcodes" size="large" />
          </div>
        ) : (
          <>
            <div
              style={{
                marginBottom: "30px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "20px",
              }}
            >
              <TextField
                value={searchTerm}
                onChange={(value) => setSearchTerm(value)}
                placeholder="Search by handle, option, or barcode"
                clearButton
                onClearButtonClick={() => setSearchTerm("")}
              />
              <Button
                onClick={updateBareCodes}
                primary
                loading={isUpdatingBarcodes}
              >
                Update All
              </Button>
            </div>
            <DataTable
              columnContentTypes={["text", "text", "text", "text", "text"]}
              headings={[
                "ID",
                "Handle",
                "Option 1 Value",
                "Variant Barcode",
                "Update",
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
                  Math.ceil(filteredBarcodes.length / itemsPerPage)
                }
                onNext={handleNextPage}
              />
            </div>
          </>
        )}
      </Card>
    </>
  );
};

export default Barcode;
