import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiFailure, type Article, type CatalogueApi, type Client, type Colour, type Size } from "../api";
import { LocaleProvider } from "../i18n/LocaleProvider";
import { CataloguePage } from "./CataloguePage";

const clients: Client[] = [
  { id: "c1", name: "Maison Textile", country: "TN" },
];

const articles: Article[] = [
  {
    id: "a1",
    reference: "ART-100",
    label: "Chemise",
    clientId: "c1",
    sizeType: "Alpha",
    unit: "pcs",
  },
];

const colours: Colour[] = [{ id: "k1", code: "NV", label: "Noir" }];
const sizes: Size[] = [{ id: "z1", code: "S", label: "S", sizeType: "Alpha" }];

function fakeApi(overrides: Partial<CatalogueApi> = {}): CatalogueApi {
  return {
    clients: vi.fn().mockResolvedValue(clients),
    searchArticles: vi.fn().mockResolvedValue(articles),
    createArticle: vi.fn(),
    updateArticle: vi.fn(),
    deleteArticle: vi.fn().mockResolvedValue(undefined),
    searchColours: vi.fn().mockResolvedValue(colours),
    createColour: vi.fn(),
    updateColour: vi.fn(),
    deleteColour: vi.fn().mockResolvedValue(undefined),
    searchSizes: vi.fn().mockResolvedValue(sizes),
    createSize: vi.fn(),
    updateSize: vi.fn(),
    deleteSize: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("CataloguePage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("Browse the catalogue in the UI", async () => {
    render(<LocaleProvider><CataloguePage api={fakeApi()} canManage /></LocaleProvider>);

    expect(await screen.findByText("ART-100")).toBeInTheDocument();
    expect(screen.getByText("Chemise")).toBeInTheDocument();
    expect(screen.getByText("Maison Textile")).toBeInTheDocument();
  });

  it("offers to clear the search when nothing matches", async () => {
    const api = fakeApi({ searchArticles: vi.fn().mockResolvedValue([]) });
    render(<LocaleProvider><CataloguePage api={api} canManage /></LocaleProvider>);

    const search = screen.getByLabelText("Search");
    fireEvent.change(search, { target: { value: "ZZZ" } });
    fireEvent.submit(search.closest("form")!);

    const clear = await screen.findByTestId("clear-search");
    fireEvent.click(clear);

    expect(search).toHaveValue("");
    expect(search).toHaveFocus();
    await waitFor(() => expect(api.searchArticles).toHaveBeenLastCalledWith(""));
  });

  it("shows colours and sizes on their tabs", async () => {
    render(<LocaleProvider><CataloguePage api={fakeApi()} canManage /></LocaleProvider>);
    await screen.findByText("ART-100");

    fireEvent.click(screen.getByRole("button", { name: "Colours" }));
    expect(await screen.findByText("NV")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Sizes" }));
    expect(await screen.findByText("Alpha")).toBeInTheDocument();
  });

  it("Create an entry from the UI", async () => {
    const api = fakeApi({
      createColour: vi.fn().mockResolvedValue({ id: "k2", code: "BL", label: "Bleu" }),
    });
    render(<LocaleProvider><CataloguePage api={api} canManage /></LocaleProvider>);
    await screen.findByText("ART-100");

    fireEvent.click(screen.getByRole("button", { name: "Colours" }));
    await screen.findByText("NV");
    fireEvent.click(screen.getByRole("button", { name: "New" }));

    fireEvent.change(screen.getByLabelText("Code"), { target: { value: "BL" } });
    fireEvent.change(screen.getByLabelText("Label"), { target: { value: "Bleu" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(api.createColour).toHaveBeenCalledWith({ code: "BL", label: "Bleu" }),
    );
  });

  it("Show a validation error in the UI", async () => {
    const api = fakeApi({
      createArticle: vi.fn().mockRejectedValue(
        new ApiFailure("VALIDATION_FAILED", "The article could not be saved.", {
          reference: "Reference is required.",
        }),
      ),
    });
    render(<LocaleProvider><CataloguePage api={api} canManage /></LocaleProvider>);
    await screen.findByText("ART-100");

    fireEvent.click(screen.getByRole("button", { name: "New" }));
    fireEvent.change(screen.getByLabelText("Reference"), { target: { value: "ART-1" } });
    fireEvent.change(screen.getByLabelText("Label"), { target: { value: "Shirt" } });
    fireEvent.change(screen.getByLabelText("Client"), { target: { value: "c1" } });
    fireEvent.change(screen.getByLabelText("Unit"), { target: { value: "pcs" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByTestId("form-error")).toHaveTextContent(
      "The article could not be saved.",
    );
    expect(screen.getByText("Reference is required.")).toBeInTheDocument();

    const reference = screen.getByLabelText("Reference");
    expect(reference).toHaveAttribute("aria-invalid", "true");
    const describedBy = reference.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)).toHaveTextContent(
      "Reference is required.",
    );
  });

  it("Read-only catalogue for a supervisor", async () => {
    render(<LocaleProvider><CataloguePage api={fakeApi()} canManage={false} /></LocaleProvider>);

    expect(await screen.findByText("ART-100")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "New" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
  });

  it("confirms a delete in a labelled dialog before removing the row", async () => {
    const api = fakeApi();
    render(<LocaleProvider><CataloguePage api={api} canManage /></LocaleProvider>);
    await screen.findByText("ART-100");

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAccessibleName("Delete this entry?");
    // The safe choice holds focus, and Escape does not dismiss a destructive
    // decision.
    expect(screen.getByTestId("dialog-cancel")).toHaveFocus();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("dialog-cancel"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(api.deleteArticle).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    fireEvent.click(screen.getByTestId("dialog-confirm"));

    await waitFor(() => expect(api.deleteArticle).toHaveBeenCalledWith("a1"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("guards unsaved changes when the editor is closed", async () => {
    render(<LocaleProvider><CataloguePage api={fakeApi()} canManage /></LocaleProvider>);
    await screen.findByText("ART-100");

    fireEvent.click(screen.getByRole("button", { name: "New" }));
    fireEvent.change(screen.getByLabelText("Label"), { target: { value: "Brouillon" } });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAccessibleName("Discard unsaved changes?");
    fireEvent.click(screen.getByRole("button", { name: "Keep editing" }));
    expect(screen.getByTestId("entry-form")).toBeInTheDocument();
    expect(screen.getByLabelText("Label")).toHaveValue("Brouillon");

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    fireEvent.click(screen.getByTestId("dialog-confirm"));
    await waitFor(() =>
      expect(screen.queryByTestId("entry-form")).not.toBeInTheDocument(),
    );
  });

  it("edits an existing entry", async () => {
    const api = fakeApi({
      updateColour: vi.fn().mockResolvedValue({ id: "k1", code: "NV", label: "Noir édité" }),
    });
    render(<LocaleProvider><CataloguePage api={api} canManage /></LocaleProvider>);
    await screen.findByText("ART-100");

    fireEvent.click(screen.getByRole("button", { name: "Colours" }));
    await screen.findByText("NV");
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));

    // The editor sits in the page aside and the list stays visible.
    expect(screen.getByTestId("entry-form").closest("aside")).not.toBeNull();
    expect(screen.getByTestId("entries-table")).toBeInTheDocument();

    const labelInput = screen.getByLabelText("Label");
    expect(labelInput).toHaveValue("Noir");
    fireEvent.change(labelInput, { target: { value: "Noir édité" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(api.updateColour).toHaveBeenCalledWith("k1", { code: "NV", label: "Noir édité" }),
    );
  });
});
