import React, { useState } from "react";
import { Frame, Page, Icon } from "@shopify/polaris";
import { HomeMajor, ProductsMajor, BarcodeMajor } from "@shopify/polaris-icons";
import { ProductsCard } from "../components";
import ProductsList from "../components/ProductsList";
import Barcode from "../components/Barcode";
import ImportConfigPage from "../components/FilesPage";
import "./App.css";
import logo from "../assets/images.png";

export default function App() {
  const [selectedPage, setSelectedPage] = useState("home");

  const handleNavigation = (page) => {
    setSelectedPage(page);
  };

  const renderContent = () => {
    switch (selectedPage) {
      case "home":
        return <ProductsCard />;
      case "Products":
        return <ProductsList />;
      case "filter":
        return <ImportConfigPage />;
      case "barcodes":
        return <Barcode />;
      default:
        return null;
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <nav className="navbar">
        <img
          src={logo}
          alt=""
          style={{ width: "150px", height: "100px", objectFit: "contain" }}
        />

        <ul>
          <li
            className={selectedPage === "home" ? "selected" : ""}
            onClick={() => handleNavigation("home")}
          >
            <span className="nav-item">
              <Icon source={HomeMajor} color="base" />
              <span className="nav-label">Home</span>
            </span>
          </li>
          <li
            className={selectedPage === "Products" ? "selected" : ""}
            onClick={() => handleNavigation("Products")}
          >
            <span className="nav-item">
              <Icon source={ProductsMajor} color="base" />
              <span className="nav-label">Products</span>
            </span>
          </li>
          <li
            className={selectedPage === "barcodes" ? "selected" : ""}
            onClick={() => handleNavigation("barcodes")}
          >
            <span className="nav-item">
              <Icon source={BarcodeMajor} color="base" />
              <span className="nav-label">Barcodes</span>
            </span>
          </li>
          <li
            className={selectedPage === "filter" ? "selected" : ""}
            onClick={() => handleNavigation("filter")}
          >
            <span className="nav-item">
              <Icon source={BarcodeMajor} color="base" />
              <span className="nav-label">Filters</span>
            </span>
          </li>
        </ul>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        <Frame>
          <Page fullWidth title={selectedPage}>
            {renderContent()}
          </Page>
        </Frame>
      </main>
    </div>
  );
}
