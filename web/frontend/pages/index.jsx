import React, { useState } from "react";
import {
  Page,
  Layout,
  Navigation,
  Frame,
  TopBar,
  Card,
  TextContainer,
  Heading,
} from "@shopify/polaris";
import { HomeMajor, ProductsMajor, OrdersMajor } from "@shopify/polaris-icons";
import { ProductsCard } from "../components";

export default function App() {
  const [selectedPage, setSelectedPage] = useState("home");

  const handleNavigation = (page) => {
    setSelectedPage(page);
  };

  const renderContent = () => {
    switch (selectedPage) {
      case "home":
        return <ProductsCard />;
      case "products":
        return (
          <Card sectioned>
            <Heading>Products Page</Heading>
            <TextContainer>Manage your products here.</TextContainer>
          </Card>
        );
      case "orders":
        return (
          <Card sectioned>
            <Heading>Orders Page</Heading>
            <TextContainer>View and manage your orders here.</TextContainer>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <Frame 
      navigation={
        <Navigation location="/">
          <Navigation.Section 
            items={[
              {
                label: "Home",
                icon: HomeMajor,
                selected: selectedPage === "home",
                onClick: () => handleNavigation("home"),
              },
              {
                label: "Products",
                icon: ProductsMajor,
                selected: selectedPage === "products",
                onClick: () => handleNavigation("products"),
              },
              {
                label: "Orders",
                icon: OrdersMajor,
                selected: selectedPage === "orders",
                onClick: () => handleNavigation("orders"),
              },
            ]}
          />
        </Navigation>
      }
    >
      <Page>{renderContent()}</Page>
    </Frame>
  );
}
