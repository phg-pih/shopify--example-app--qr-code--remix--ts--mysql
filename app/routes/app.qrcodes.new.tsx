import { useState } from "react";
import { useActionData, useNavigation, useNavigate, useSubmit } from "@remix-run/react";
import type { ActionFunctionArgs} from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import {
  createQRCode,
  type QRCode,
  validateQRCode
} from "../models/QRCode.server";
import {
  Card,
  Bleed,
  Button,
  ChoiceList,
  Divider,
  EmptyState,
  InlineStack,
  InlineError,
  Layout,
  Page,
  Text,
  TextField,
  Thumbnail,
  BlockStack,
  PageActions,
} from "@shopify/polaris";

interface QRCodeFormState {
  id?: number;
  title: string;
  productId?: string;
  productVariantId?: string;
  productHandle?: string;
  productTitle?: string;
  productImage?: string;
  productAlt?: string | null;
  destination: "product" | "cart";
  destinationUrl?: string;
  image?: string;
}

export async function action({ request, params }: ActionFunctionArgs) {

  const formData = await request.formData();
  const { session } = await authenticate.admin(request);
  const { shop } = session;
  const data = {
    ...Object.fromEntries(formData),
    shop
  };

  const errors = validateQRCode(data);
  if (errors) {
    return json({ errors }, { status: 422 });
  }

  const qrCode = await createQRCode({
    ...data,
  } as Partial<QRCode>);

  return redirect(`/app/qrcodes/${qrCode.id}`);
}

export default function QRCodeDetails() {
  const actionData = useActionData<typeof action>();
  const errors = (actionData?.errors || {}) as QRCodeFormState;

  const [formState, setFormState] = useState<QRCodeFormState>({} as QRCodeFormState);
  const [cleanFormState, setCleanFormState] = useState<QRCodeFormState>({} as QRCodeFormState);

  const isDirty = JSON.stringify(formState) !== JSON.stringify(cleanFormState);
  const nav = useNavigation();
  const navigate = useNavigate();
  const isSaving = nav.state === "submitting" && nav.formData?.get("action") !== "delete";
  const isDeleting = nav.state === "submitting" && nav.formData?.get("action") === "delete";

  async function selectProduct() {
    const products = await window.shopify.resourcePicker({
      type: "product",
      action: "select", // customized action verb, either 'select' or 'add',
    });

    if (products) {
      const product = products[0] as {
        images: Array<{altText?: string, originalSrc: string}>;
        id: string;
        variants: Array<{id: string}>;
        title: string;
        handle: string;
      };
      const { images, id, variants, title, handle } = product;
      setFormState({
        ...formState,
        productId: id,
        productVariantId: variants[0].id,
        productTitle: title,
        productHandle: handle,
        productAlt: images[0]?.altText || null,
        productImage: images[0]?.originalSrc,
      });
    }
  }

  const submit = useSubmit();
  async function handleSave() {
    const data = {
      title: formState.title,
      productId: formState.productId || "",
      productVariantId: formState.productVariantId || "",
      productHandle: formState.productHandle || "",
      destination: formState.destination,
    };

    setCleanFormState({ ...formState });
    submit(data, { method: "post" });
  }

  return (
      <Page>
        <ui-title-bar title={"Create new QR code"}>
          <button variant="breadcrumb" onClick={() => navigate("/app")}>
            QR codes
          </button>
        </ui-title-bar>
        <Layout>
          <Layout.Section>
            <BlockStack gap="500">
              <Card>
                <BlockStack gap="500">
                  <Text as={"h2"} variant="headingLg">
                    Title
                  </Text>
                  <TextField
                      id="title"
                      helpText="Only store staff can see this title"
                      label="title"
                      labelHidden
                      autoComplete="off"
                      value={formState.title}
                      onChange={(title) => setFormState({ ...formState, title })}
                      error={errors.title}
                  />
                </BlockStack>
              </Card>
              <Card>
                <BlockStack gap="500">
                  <InlineStack align="space-between">
                    <Text as={"h2"} variant="headingLg">
                      Product
                    </Text>
                    {formState.productId ? (
                        <Button variant="plain" onClick={selectProduct}>
                          Change product
                        </Button>
                    ) : null}
                  </InlineStack>
                  {formState.productId ? (
                      <InlineStack blockAlign="center" gap="500">
                        <Thumbnail
                            source={formState.productImage ?? "#"}
                            alt={formState.productAlt ?? ""}
                        />
                        <Text as="span" variant="headingMd" fontWeight="semibold">
                          {formState.productTitle}
                        </Text>
                      </InlineStack>
                  ) : (
                      <BlockStack gap="200">
                        <Button onClick={selectProduct} id="select-product">
                          Select product
                        </Button>
                        {errors.productId ? (
                            <InlineError
                                message={errors.productId}
                                fieldID="myFieldID"
                            />
                        ) : null}
                      </BlockStack>
                  )}
                  <Bleed marginInlineStart="200" marginInlineEnd="200">
                    <Divider />
                  </Bleed>
                  <InlineStack gap="500" align="space-between" blockAlign="start">
                    <ChoiceList
                        title="Scan destination"
                        choices={[
                          { label: "Link to product page", value: "product" },
                          {
                            label: "Link to checkout page with product in the cart",
                            value: "cart",
                          },
                        ]}
                        selected={[formState.destination]}
                        onChange={(destination) =>
                            setFormState({
                              ...formState,
                              destination: (destination[0] as "product" | "cart") ?? "product",
                            })
                        }
                        error={errors.destination}
                    />
                  </InlineStack>
                </BlockStack>
              </Card>
            </BlockStack>
          </Layout.Section>
          <Layout.Section variant="oneThird">
            <Card>
              <Text as={"h2"} variant="headingLg">
                QR code
              </Text>
              {(
                  <EmptyState image="">
                    Your QR code will appear here after you save
                  </EmptyState>
              )}
            </Card>
          </Layout.Section>
          <Layout.Section>
            <PageActions
                secondaryActions={[
                  {
                    content: "Delete",
                    loading: isDeleting,
                    disabled: isSaving || isDeleting,
                    destructive: true,
                    outline: true,
                    onAction: () =>
                        submit({ action: "delete" }, { method: "post" }),
                  },
                ]}
                primaryAction={{
                  content: "Save",
                  loading: isSaving,
                  disabled: !isDirty || isSaving || isDeleting,
                  onAction: handleSave,
                }}
            />
          </Layout.Section>
        </Layout>
      </Page>
  );
}
