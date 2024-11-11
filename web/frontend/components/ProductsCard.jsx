import { useState } from "react";
import {
  Card,
  Heading,
  TextContainer,
  DisplayText,
  TextStyle,
  Button,
  ButtonGroup,
} from "@shopify/polaris";
import { Toast } from "@shopify/app-bridge-react";
import { useAppQuery, useAuthenticatedFetch } from "../hooks";

export function ProductsCard() {
  const emptyToastProps = { content: null };
  const [isLoading, setIsLoading] = useState(true);
  const [toastProps, setToastProps] = useState(emptyToastProps);
  const fetch = useAuthenticatedFetch();


  const {
    data,
    refetch: refetchProductCount,
    isLoading: isLoadingCount,
    isRefetching: isRefetchingCount,
  } = useAppQuery({
    url: "/api/products/count",
    reactQueryOptions: {
      onSuccess: () => {
        setIsLoading(false);
      },
    },
  });
  console.log(data);
  const toastMarkup = toastProps.content && !isRefetchingCount && (
    <Toast {...toastProps} onDismiss={() => setToastProps(emptyToastProps)} />
  );

  const handlePopulate = async () => {
    setIsLoading(true);
    const response = await fetch("/api/products/create");

    if (response.ok) {
      await refetchProductCount();
      setToastProps({ content: "Catalogo Aggiornato!" });
    } else {
      setIsLoading(false);
      setToastProps({
        content: "There was an error creating products",
        error: true,
      });
    }
  };

  const handleUpdateOrders = async () => {
    setIsLoading(true);
    const response = await fetch("/api/orders/last-week");

    if (response.ok) {
      setToastProps({ content: "Ordini aggiornati con successo!" });
    } else {
      setIsLoading(false);
      setToastProps({
        content: "C'è stato un errore nell'aggiornamento degli ordini",
        error: true,
      });
    }
  };
  const getAmazon = async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/amazon");

      if (response.ok) {
        const data = await response.json(); // Parse the response JSON to access data

        setToastProps({ content: "Amazon data retrieved successfully" });
        console.log(data); // Log the data

        // Access data properties if needed
        // console.log(data.someProperty);
      } else {
        setToastProps({
          content: "C'è stato un errore nell'aggiornamento degli ordini",
          error: true,
        });
      }
    } catch (error) {
      console.error("Error fetching Amazon data:", error);
      setToastProps({
        content: "C'è stato un errore di rete",
        error: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {toastMarkup}
      <Card
        title="Aggiorna Catalogo"
        sectioned
        primaryFooterAction={{
          content: "Aggiorna",
          onAction: handlePopulate,
          loading: isLoading,
        }}
         secondaryFooterActions={[
            {
              content: "Aggiorna Ordini",
              onAction: handleUpdateOrders,
              loading: isLoading,
            },
          ]}
        // secondaryFooterActions={[
        //   {
        //     content: "get Amazon",
        //     onAction: getAmazon,
        //     loading: isLoading,
        //   },
        // ]}
      >
        <TextContainer spacing="loose">
          <p>
            Clicca per importare i device disponibili su Trova-Usati
            <br></br>
          </p>
          <h3>
            <b>
              Ricorda di cliccare aggiorna solo una volta per evitare di
              sovrappore le importazioni!
            </b>
          </h3>
          <Heading element="h4">
            TOTALE DEI PRODOTTI IMPORTATI DA TROVA USATI
            <DisplayText size="medium">
              <TextStyle variation="">
                Istore : {isLoadingCount ? "-" : data.count} <br></br>
                Cellulari Usati : {isLoadingCount ? "-" : data.countIvan}<br></br>
                Amazon : {isLoadingCount ? "-" : data.ImportAZ}
              </TextStyle>
            </DisplayText>
          </Heading>
        </TextContainer>
      </Card>
    </>
  );
}
