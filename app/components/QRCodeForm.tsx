import { useState, useEffect } from "react";
import { Form } from "@remix-run/react";
import {
  Banner, Button,
  // Button,
  Card,
  FormLayout,
  Layout,
  Page,
  BlockStack,
  Select,
  TextField, Text, InlineStack
} from "@shopify/polaris";
// import { ImageMajor } from "@shopify/polaris-icons";
// import { QRCodeValidationErrors } from "../models/QRCode.server";

interface FormErrors {
  title?: string;
  productId?: string;
  destination?: string;
}

interface Product {
  id: string;
  title: string;
  images: {
    nodes: Array<{
      url: string;
    }>;
  };
  variants: {
    nodes: Array<{
      id: string;
    }>;
  };
}

interface QRCodeFormProps {
  formErrors?: FormErrors;
  action: string;
  products: Product[];
  initialData?: {
    title?: string;
    productId?: string;
    destination?: string;
  };
}

export function QRCodeForm({ formErrors, action, products, initialData }: QRCodeFormProps) {
  const [formState, setFormState] = useState(initialData || {
    title: "",
    productId: "",
    destination: "product",
  });
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(undefined);

  useEffect(() => {
    if (formState.productId && products.length > 0) {
      const product = products.find((product) => product.id === formState.productId);
      setSelectedProduct(product);
    }
  }, [formState.productId, products]);

  const productOptions = products.map((product) => ({
    label: product.title,
    value: product.id,
  }));

  const handleFormChange = (field: string, value: string) => {
    setFormState({
      ...formState,
      [field]: value,
    });
  };

  return (
    <Page>
      <BlockStack gap="500">
        <InlineStack align="space-around">
          <Text variant="headingLg" as="h2">QR Code Details</Text>
          <Button url="/app" variant="secondary">Back to List</Button>
        </InlineStack>
        <Layout>
          <Layout.Section>
            <Form method="post" action={action}>
              <Card>
                <FormLayout>
                  {formErrors && (
                    <Banner key="qr-code-action-banner">
                      <p>There were some issues with your form submission:</p>
                      <ul>
                        {Object.entries(formErrors).map(([key, value]) => (
                          <li key={key}>{value}</li>
                        ))}
                      </ul>
                    </Banner>
                  )}

                  <TextField
                    label="Title"
                    id="title"
                    name="title"
                    value={formState.title}
                    onChange={(value) => handleFormChange("title", value)}
                    error={formErrors?.title}
                    autoComplete="off"
                  />

                  <Select
                    label="Product"
                    options={productOptions}
                    value={formState.productId}
                    onChange={(value) => handleFormChange("productId", value)}
                    error={formErrors?.productId}
                    name="productId"
                  />

                  <Select
                    label="Destination"
                    options={[
                      { label: "Product page", value: "product" },
                      { label: "Add to cart", value: "cart" },
                    ]}
                    value={formState.destination}
                    onChange={(value) => handleFormChange("destination", value)}
                    error={formErrors?.destination}
                    name="destination"
                  />

                  {selectedProduct && (
                    <div className="qr-code-preview">
                      <img
                        src={selectedProduct.images.nodes[0]?.url}
                        alt={`${selectedProduct.title} product`}
                        width={200}
                      />
                    </div>
                  )}

                  {/* Hidden fields needed for QR code creation */}
                  {selectedProduct && (
                    <>
                      <input
                        type="hidden"
                        name="productHandle"
                        value={selectedProduct.title.toLowerCase().replace(/\s/g, "-")}
                      />
                      <input
                        type="hidden"
                        name="productVariantId"
                        value={selectedProduct.variants.nodes[0]?.id || ""}
                      />
                    </>
                  )}
                </FormLayout>
              </Card>
              <Button submit={true}>Save</Button>
            </Form>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
