import React, { useState, useEffect } from "react";
import { Grid, GridColumn } from "@progress/kendo-react-grid";
import { Drawer, DrawerContent } from "@progress/kendo-react-layout";
import { Toolbar, Button } from "@progress/kendo-react-buttons";
import { Dialog } from "@progress/kendo-react-dialogs";
import { Form, Field } from "@progress/kendo-react-form";
import { Input, Switch } from "@progress/kendo-react-inputs";
import { ProgressBar } from "@progress/kendo-react-progressbars";
import { Notification } from "@progress/kendo-react-notification";
import { DropDownList } from "@progress/kendo-react-dropdowns";
import { Chart, ChartSeries, ChartSeriesItem, ChartCategoryAxis, ChartCategoryAxisItem } from "@progress/kendo-react-charts";
import { Loader } from "@progress/kendo-react-indicators";
import { Scheduler, TimelineView, DayView, WeekView, MonthView } from "@progress/kendo-react-scheduler";
import { Editor } from "@progress/kendo-react-editor";
import { TreeView } from "@progress/kendo-react-treeview";
import { Upload } from "@progress/kendo-react-upload";
import { saveAs } from "file-saver";
import { Icon } from "@progress/kendo-react-common";
import * as tf from "@tensorflow/tfjs";
import "@progress/kendo-theme-default/dist/all.css";

const App = () => {
  const [inventoryData, setInventoryData] = useState([
    { id: 1, name: "Laptop", category: "Electronics", stock: 10, reorderLevel: 5, supplierId: 1 },
    { id: 2, name: "Desk Chair", category: "Furniture", stock: 5, reorderLevel: 3, supplierId: 2 },
    { id: 3, name: "Notebook", category: "Stationery", stock: 20, reorderLevel: 10, supplierId: 1 },
  ]);
  const [suppliers, setSuppliers] = useState([
    { id: 1, name: "Tech Supplier Inc.", contact: "tech@example.com" },
    { id: 2, name: "Furniture World", contact: "furniture@example.com" },
  ]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [editSupplier, setEditSupplier] = useState(null);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [drawerExpanded, setDrawerExpanded] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [userPoints, setUserPoints] = useState(0);
  const [predictions, setPredictions] = useState({}); // Store AI predictions

  // AI Integration: Train a linear regression model
  const trainModel = async () => {
    const model = tf.sequential();
    model.add(tf.layers.dense({ units: 1, inputShape: [1] }));
    model.compile({ loss: "meanSquaredError", optimizer: "sgd" });

    // Historical stock data (example)
    const xs = tf.tensor1d([10, 20, 30, 40, 50]); // Stock levels
    const ys = tf.tensor1d([5, 10, 15, 20, 25]); // Reorder levels

    // Train the model
    console.log("Training model...");
    await model.fit(xs, ys, { epochs: 100 });
    console.log("Model trained successfully!");

    return model;
  };

  // Predict stock requirements using the trained model
  const predictStock = async (item) => {
    try {
      const model = await trainModel();
      const predictedStock = model.predict(tf.tensor1d([item.stock]));
      const predictedValue = predictedStock.dataSync()[0];
      console.log(`Predicted stock for ${item.name}: ${predictedValue}`);
      setPredictions((prev) => ({ ...prev, [item.id]: predictedValue }));
    } catch (error) {
      console.error("Error predicting stock:", error);
    }
  };

  // Gamification: Calculate User Points
  useEffect(() => {
    const points = inventoryData.filter(item => item.stock > item.reorderLevel).length * 10;
    setUserPoints(points);
  }, [inventoryData]);

  // Filter data based on search term and category
  const categories = ["All", "Electronics", "Furniture", "Stationery"];
  const filteredData = inventoryData.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate summary data
  const totalItems = inventoryData.length;
  const totalStock = inventoryData.reduce((sum, item) => sum + item.stock, 0);
  const lowStockCount = lowStockItems.length;

  // Highlight low-stock rows
  const rowRender = (trElement, props) => {
    const isLowStock = props.dataItem.stock <= props.dataItem.reorderLevel;
    const redStyle = { backgroundColor: "#ffcccc" };
    return React.cloneElement(trElement, { style: isLowStock ? redStyle : {} }, trElement.props.children);
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ["ID", "Name", "Category", "Stock", "Reorder Level", "Supplier"];
    const csvContent = [
      headers.join(","),
      ...inventoryData.map(item => [item.id, item.name, item.category, item.stock, item.reorderLevel, suppliers.find(s => s.id === item.supplierId)?.name || "N/A"].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    saveAs(blob, "inventory.csv");
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Simulate loading state
  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000); // Simulate 1 second loading
  }, [inventoryData]);

  useEffect(() => {
    const lowStock = inventoryData.filter(item => item.stock <= item.reorderLevel);
    setLowStockItems(lowStock);
  }, [inventoryData]);

  const handleAddOrEditItem = (dataItem) => {
    if (editItem) {
      setInventoryData(inventoryData.map(item => (item.id === editItem.id ? { ...dataItem, id: editItem.id } : item)));
    } else {
      setInventoryData([...inventoryData, { id: inventoryData.length + 1, ...dataItem }]);
    }
    setDialogOpen(false);
    setEditItem(null);
  };

  const handleAddOrEditSupplier = (supplier) => {
    if (editSupplier) {
      setSuppliers(suppliers.map(s => s.id === editSupplier.id ? { ...supplier, id: editSupplier.id } : s));
    } else {
      setSuppliers([...suppliers, { id: suppliers.length + 1, ...supplier }]);
    }
    setSupplierDialogOpen(false);
    setEditSupplier(null);
  };

  const handleEdit = (item) => {
    setEditItem(item);
    setDialogOpen(true);
  };

  const handleEditSupplier = (supplier) => {
    setEditSupplier(supplier);
    setSupplierDialogOpen(true);
  };

  const handleDelete = (id) => {
    setInventoryData(inventoryData.filter(item => item.id !== id));
  };

  const handleDeleteSupplier = (id) => {
    setSuppliers(suppliers.filter(s => s.id !== id));
  };

  const handleBulkDelete = () => {
    setInventoryData(inventoryData.filter(item => !selectedItems.includes(item.id)));
    setSelectedItems([]);
  };

  const handleSelect = (item) => {
    if (selectedItems.includes(item.id)) {
      setSelectedItems(selectedItems.filter(id => id !== item.id));
    } else {
      setSelectedItems([...selectedItems, item.id]);
    }
  };

  const getProgressColor = (stock) => {
    if (stock <= 5) return "red";
    if (stock <= 15) return "orange";
    return "green";
  };

  return (
    <div className="app-container" style={{ display: "flex", height: "100vh", backgroundColor: isDarkMode ? "#333" : "#e8ecf1", color: isDarkMode ? "#fff" : "#000" }}>
      {/* Enhanced Sidebar */}
      <Drawer
        expanded={drawerExpanded}
        onOverlayClick={() => setDrawerExpanded(false)}
        onSelect={() => setDrawerExpanded(!drawerExpanded)}
        items={[
          { text: "Dashboard", icon: "k-i-grid" },
          { text: "Analytics", icon: "k-i-chart" },
          { text: "Categories", icon: "k-i-tags" },
          { text: "Suppliers", icon: "k-i-group" },
          { text: "Settings", icon: "k-i-cog" },
          { text: "Help", icon: "k-i-question" },
        ]}
        style={{ backgroundColor: "#2D3E50", color: "#fff", padding: "10px", boxShadow: "2px 0 5px rgba(0, 0, 0, 0.1)" }}
      >
        <div style={{ padding: "20px", textAlign: "center" }}>
          {/* User Profile */}
          <div style={{ marginBottom: "20px" }}>
            <img
              src="https://via.placeholder.com/80"
              alt="User Avatar"
              style={{ borderRadius: "50%", width: "80px", height: "80px", boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)" }}
            />
            <h3 style={{ margin: "10px 0 5px", fontSize: "18px", fontWeight: "bold" }}>John Doe</h3>
            <p style={{ margin: 0, fontSize: "14px", color: "#ccc" }}>Admin</p>
          </div>

          {/* Gamification: User Points */}
          <div style={{ marginBottom: "20px" }}>
            <h4 style={{ margin: "0 0 10px", fontSize: "16px", fontWeight: "bold" }}>Your Points</h4>
            <p style={{ fontSize: "24px", fontWeight: "bold", color: "#28a745" }}>{userPoints}</p>
          </div>

          {/* Category Filter */}
          <div style={{ marginBottom: "20px" }}>
            <h4 style={{ margin: "0 0 10px", fontSize: "16px", fontWeight: "bold" }}>Filter by Category</h4>
            <DropDownList
              data={categories}
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.value)}
              style={{ width: "100%", backgroundColor: isDarkMode ? "#3A4B5C" : "#34495E", color: "#fff", borderRadius: "6px" }}
            />
          </div>

          {/* Theme Customization */}
          <div style={{ marginBottom: "20px" }}>
            <h4 style={{ margin: "0 0 10px", fontSize: "16px", fontWeight: "bold" }}>Theme</h4>
            <Switch
              checked={isDarkMode}
              onChange={toggleDarkMode}
              label="Dark Mode"
              style={{ marginBottom: "10px" }}
            />
          </div>
        </div>
      </Drawer>

      <DrawerContent style={{ padding: "20px", flex: 1 }}>
        <Toolbar style={{ backgroundColor: isDarkMode ? "#444" : "#fff", padding: "15px", borderRadius: "8px", boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)" }}>
          <Button onClick={() => setDrawerExpanded(!drawerExpanded)} style={{ marginRight: "10px" }}>☰</Button>
          <Button primary={true} onClick={() => setDialogOpen(true)} style={{ backgroundColor: "#007BFF", color: "white", fontWeight: "bold", borderRadius: "6px" }}>+ Add Item</Button>
          <Button onClick={exportToCSV} style={{ backgroundColor: "#17a2b8", color: "white", fontWeight: "bold", borderRadius: "6px", marginLeft: "10px" }}>Export to CSV</Button>
          <Button onClick={handleBulkDelete} disabled={selectedItems.length === 0} style={{ backgroundColor: "#dc3545", color: "white", fontWeight: "bold", borderRadius: "6px", marginLeft: "10px" }}>Delete Selected</Button>
          <Button onClick={() => setSupplierDialogOpen(true)} style={{ backgroundColor: "#28a745", color: "white", fontWeight: "bold", borderRadius: "6px", marginLeft: "10px" }}>+ Add Supplier</Button>
          <Switch checked={isDarkMode} onChange={toggleDarkMode} style={{ marginLeft: "10px" }} />
        </Toolbar>

        {lowStockItems.length > 0 && (
  <Notification
    type={{ style: "warning", icon: true }}
    closable={true}
    style={{ 
      margin: "15px 0", 
      backgroundColor: "#fff3cd", 
      borderLeft: "6px solid #ffc107", 
      padding: "10px" 
    }}
  >
    <strong>Warning:</strong> Some items are running low on stock!
  </Notification>
)}

        {/* Inventory Summary Cards */}
        <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
          <div style={{ backgroundColor: isDarkMode ? "#444" : "#fff", padding: "15px", borderRadius: "8px", boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)", flex: 1 }}>
            <h3 style={{ margin: "0", color: "#007BFF" }}>Total Items</h3>
            <p style={{ fontSize: "24px", fontWeight: "bold" }}>{totalItems}</p>
          </div>
          <div style={{ backgroundColor: isDarkMode ? "#444" : "#fff", padding: "15px", borderRadius: "8px", boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)", flex: 1 }}>
            <h3 style={{ margin: "0", color: "#28a745" }}>Total Stock</h3>
            <p style={{ fontSize: "24px", fontWeight: "bold" }}>{totalStock}</p>
          </div>
          <div style={{ backgroundColor: isDarkMode ? "#444" : "#fff", padding: "15px", borderRadius: "8px", boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)", flex: 1 }}>
            <h3 style={{ margin: "0", color: "#dc3545" }}>Low Stock Items</h3>
            <p style={{ fontSize: "24px", fontWeight: "bold" }}>{lowStockCount}</p>
          </div>
        </div>

        {/* Sales Trends Chart */}
        <div style={{ backgroundColor: isDarkMode ? "#444" : "#fff", padding: "20px", borderRadius: "8px", marginBottom: "20px", boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)" }}>
          <Chart>
            <ChartCategoryAxis>
              <ChartCategoryAxisItem categories={["Jan", "Feb", "Mar", "Apr"]} />
            </ChartCategoryAxis>
            <ChartSeries>
              <ChartSeriesItem type="line" data={[100, 200, 150, 300]} />
            </ChartSeries>
          </Chart>
        </div>

        {/* Scheduler */}
        <div style={{ backgroundColor: isDarkMode ? "#444" : "#fff", padding: "20px", borderRadius: "8px", marginBottom: "20px", boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)" }}>
          <h3 style={{ margin: "0 0 20px", fontSize: "20px", fontWeight: "bold" }}>Scheduler</h3>
          <Scheduler
            data={[
              {
                id: 1,
                title: "Meeting",
                start: new Date(2023, 10, 10, 9, 0),
                end: new Date(2023, 10, 10, 10, 0),
              },
              {
                id: 2,
                title: "Inventory Check",
                start: new Date(2023, 10, 12, 14, 0),
                end: new Date(2023, 10, 12, 15, 0),
              },
            ]}
            defaultView="week"
          >
            <TimelineView />
            <DayView />
            <WeekView />
            <MonthView />
          </Scheduler>
        </div>

        {/* TreeView */}
        <div style={{ backgroundColor: isDarkMode ? "#444" : "#fff", padding: "20px", borderRadius: "8px", marginBottom: "20px", boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)" }}>
          <h3 style={{ margin: "0 0 20px", fontSize: "20px", fontWeight: "bold" }}>Categories</h3>
          <TreeView
            data={[
              {
                text: "Electronics",
                items: [
                  { text: "Laptops" },
                  { text: "Smartphones" },
                ],
              },
              {
                text: "Furniture",
                items: [
                  { text: "Chairs" },
                  { text: "Tables" },
                ],
              },
            ]}
          />
        </div>

        {/* Editor */}
        <div style={{ backgroundColor: isDarkMode ? "#444" : "#fff", padding: "20px", borderRadius: "8px", marginBottom: "20px", boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)" }}>
          <h3 style={{ margin: "0 0 20px", fontSize: "20px", fontWeight: "bold" }}>Item Description</h3>
          <Editor />
        </div>

        {/* Upload */}
        <div style={{ backgroundColor: isDarkMode ? "#444" : "#fff", padding: "20px", borderRadius: "8px", marginBottom: "20px", boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)" }}>
          <h3 style={{ margin: "0 0 20px", fontSize: "20px", fontWeight: "bold" }}>Upload Files</h3>
          <Upload
            withCredentials={false}
            saveUrl="https://demos.telerik.com/kendo-ui/service-v4/upload/save"
            removeUrl="https://demos.telerik.com/kendo-ui/service-v4/upload/remove"
            onUpload={(event) => console.log("Files uploaded:", event.files)}
          />
        </div>

        {/* Search and Filter */}
        <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
          <Input
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.value)}
            style={{ width: "200px" }}
          />
          <DropDownList
            data={categories}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.value)}
            style={{ width: "200px" }}
          />
        </div>

        {/* Inventory Grid */}
        {isLoading ? (
          <Loader size="large" type="infinite-spinner" />
        ) : (
          <div style={{ backgroundColor: isDarkMode ? "#444" : "#fff", padding: "20px", borderRadius: "8px", marginTop: "20px", boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)" }}>
            <Grid data={filteredData} rowRender={rowRender} pageable={true} pageSize={5} style={{ width: "100%" }}>
              <GridColumn field="selected" width="50px" cell={(props) => (
                <td>
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(props.dataItem.id)}
                    onChange={() => handleSelect(props.dataItem)}
                  />
                </td>
              )} />
              <GridColumn field="name" title="Item Name" width="200px" />
              <GridColumn field="category" title="Category" width="150px" />
              <GridColumn field="stock" title="Stock" width="150px" cell={(props) => (
                <td>
                  <ProgressBar value={props.dataItem.stock} max={50} style={{ width: "100px", backgroundColor: getProgressColor(props.dataItem.stock), borderRadius: "4px", height: "8px" }} />
                </td>
              )} />
              <GridColumn field="reorderLevel" title="Reorder Level" width="150px" />
              <GridColumn field="supplierId" title="Supplier" width="150px" cell={(props) => (
                <td>
                  {suppliers.find(s => s.id === props.dataItem.supplierId)?.name || "N/A"}
                </td>
              )} />
              <GridColumn title="Actions" width="200px" cell={(props) => (
                <td>
                  <Button onClick={() => handleEdit(props.dataItem)} style={{ marginRight: "10px", backgroundColor: "#ffc107", color: "white", fontWeight: "bold", borderRadius: "6px" }}>Edit</Button>
                  <Button onClick={() => handleDelete(props.dataItem.id)} style={{ backgroundColor: "#dc3545", color: "white", fontWeight: "bold", borderRadius: "6px" }}>Delete</Button>
                  <Button onClick={() => predictStock(props.dataItem)} style={{ backgroundColor: "#28a745", color: "white", fontWeight: "bold", borderRadius: "6px", marginLeft: "10px" }}>Predict Stock</Button>
                </td>
              )} />
            </Grid>
          </div>
        )}

        {/* Suppliers Grid */}
        <div style={{ backgroundColor: isDarkMode ? "#444" : "#fff", padding: "20px", borderRadius: "8px", marginTop: "20px", boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)" }}>
          <h3 style={{ margin: "0 0 20px", fontSize: "20px", fontWeight: "bold" }}>Suppliers</h3>
          <Grid data={suppliers} pageable={true} pageSize={5} style={{ width: "100%" }}>
            <GridColumn field="name" title="Supplier Name" width="200px" />
            <GridColumn field="contact" title="Contact" width="200px" />
            <GridColumn title="Actions" width="200px" cell={(props) => (
              <td>
                <Button onClick={() => handleEditSupplier(props.dataItem)} style={{ marginRight: "10px", backgroundColor: "#ffc107", color: "white", fontWeight: "bold", borderRadius: "6px" }}>Edit</Button>
                <Button onClick={() => handleDeleteSupplier(props.dataItem.id)} style={{ backgroundColor: "#dc3545", color: "white", fontWeight: "bold", borderRadius: "6px" }}>Delete</Button>
              </td>
            )} />
          </Grid>
        </div>
      </DrawerContent>

      {/* Add/Edit Item Dialog */}
      {dialogOpen && (
        <Dialog title={editItem ? "Edit Inventory Item" : "Add Inventory Item"} onClose={() => { setDialogOpen(false); setEditItem(null); }}>
          <Form 
            onSubmit={(dataItem) => handleAddOrEditItem(dataItem)}
            initialValues={editItem || { name: "", category: "", stock: "", reorderLevel: 0, supplierId: "" }}
            render={(formRenderProps) => (
              <form onSubmit={formRenderProps.onSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <Field name="name" component={Input} label="Item Name" required style={{ width: "100%" }} />
                <Field name="category" component={Input} label="Category" required style={{ width: "100%" }} />
                <Field name="stock" component={Input} label="Stock" type="number" required style={{ width: "100%" }} />
                <Field name="reorderLevel" component={Input} label="Reorder Level" type="number" required style={{ width: "100%" }} />
                <Field name="supplierId" component={DropDownList} label="Supplier" data={suppliers} textField="name" dataItemKey="id" style={{ width: "100%" }} />
                <div style={{ marginTop: "20px", textAlign: "right" }}>
                  <Button type="submit" primary={true} style={{ backgroundColor: "#28a745", color: "white", fontWeight: "bold", borderRadius: "6px", marginRight: "10px" }}>Save</Button>
                  <Button onClick={() => { setDialogOpen(false); setEditItem(null); }} style={{ backgroundColor: "#dc3545", color: "white", fontWeight: "bold", borderRadius: "6px" }}>Cancel</Button>
                </div>
              </form>
            )}
          />
        </Dialog>
      )}

      {/* Add/Edit Supplier Dialog */}
      {supplierDialogOpen && (
        <Dialog title={editSupplier ? "Edit Supplier" : "Add Supplier"} onClose={() => { setSupplierDialogOpen(false); setEditSupplier(null); }}>
          <Form 
            onSubmit={(supplier) => handleAddOrEditSupplier(supplier)}
            initialValues={editSupplier || { name: "", contact: "" }}
            render={(formRenderProps) => (
              <form onSubmit={formRenderProps.onSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <Field name="name" component={Input} label="Supplier Name" required style={{ width: "100%" }} />
                <Field name="contact" component={Input} label="Contact" required style={{ width: "100%" }} />
                <div style={{ marginTop: "20px", textAlign: "right" }}>
                  <Button type="submit" primary={true} style={{ backgroundColor: "#28a745", color: "white", fontWeight: "bold", borderRadius: "6px", marginRight: "10px" }}>Save</Button>
                  <Button onClick={() => { setSupplierDialogOpen(false); setEditSupplier(null); }} style={{ backgroundColor: "#dc3545", color: "white", fontWeight: "bold", borderRadius: "6px" }}>Cancel</Button>
                </div>
              </form>
            )}
          />
        </Dialog>
      )}
    </div>
  );
};

export default App;