"use client";
import {
  Box,
  Stack,
  Typography,
  Modal,
  TextField,
  Button,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { Clear } from "@mui/icons-material";
import { firestore } from "@/firebase";
import {
  collection,
  doc,
  query,
  getDocs,
  deleteDoc,
  getDoc,
  setDoc,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import CameraComponent from "./camera";



export default function Home() {
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [open, setOpen] = useState(false);
  const [itemName, setItemName] = useState("");
  const [itemCategory, setItemCategory] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchItem, setSearchItem] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [image, setImage] = useState(null);


  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");

  // const getLabelAndCategory = async (image) => {

  //     try {
  //     console.log('Sending image to API:', image);
  //     const response = await fetch('/api/getlabel', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({ image }),
  //     });
  //     const data = await response.json();
  //     if (response.ok) {
  //       return data;
  //     } else {
  //       console.error('Error from API:', data.error);
  //       throw new Error(data.error);
  //     }
  //   } catch (error) {
  //     console.error('Error fetching label and category:', error);
  //     throw error;
  //   }
  // };
  const getLabelAndCategory = async (image) => {
    try {
        console.log('Sending image to API:', image);

        const response = await fetch('/api/getLabel', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ image })
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);

        let data = await response.json();
        console.log("*****data from response:" , data)
        if (typeof data === 'string') {
            data = JSON.parse(data);
        }

        if (response.ok) {
            return data.results;
        } else {
            console.error('Error from API:', data.error);
            throw new Error(data.error);
        }
    } catch (error) {
        console.error('Error fetching label and category:', error);
        throw error;
    }
};



  const handleProcessPhoto = async () => {
    if (image) {
      const { itemName, category } = await getLabelAndCategory(image);
      setItemName(itemName);
      setItemCategory(category);
      setCameraOpen(false);
    }
  };

  const updateInventory = async () => {
    const snapshot = query(collection(firestore, "inventory"));
    const docs = await getDocs(snapshot);
    const inventoryList = [];
    docs.forEach((doc) => {
      inventoryList.push({
        name: doc.id,
        ...doc.data(),
      });
    });
    setInventory(inventoryList);
    filterInventory(inventoryList, selectedCategory);
  };

  const removeItem = async (item) => {
    const docRef = doc(collection(firestore, "inventory"), item);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const { quantity } = docSnap.data();
      if (quantity === 1) {
        await deleteDoc(docRef);
      } else {
        await setDoc(docRef, { quantity: quantity - 1 });
      }
    }
    await updateInventory();
  };

  const addItem = async (item, category) => {
    if (item.length === 0 || category.length === 0) {
      setOpen(false);
      return;
    }

    const docRef = doc(collection(firestore, "inventory"), item);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const { quantity } = docSnap.data();
      await setDoc(docRef, { quantity: quantity + 1, category });
    } else {
      await setDoc(docRef, { quantity: 1, category });
    }
    await updateInventory();
  };

  const filterInventory = (inventoryList, category) => {
    if (category) {
      const filtered = inventoryList.filter(
        (item) => item.category === category
      );
      setFilteredInventory(filtered);
    } else {
      setFilteredInventory(inventoryList);
    }
  };

  const searchItems = (searchTerm) => {
    const filtered = inventory.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredInventory(filtered);
  };

  const getVideoDevices = async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(
      (device) => device.kind === "videoinput"
    );
    setDevices(videoDevices);
    if (videoDevices.length > 0) {
      setSelectedDeviceId(videoDevices[0].deviceId);
    }
  };

  useEffect(() => {
    updateInventory();
    getVideoDevices();
  }, []);

  useEffect(() => {
    filterInventory(inventory, selectedCategory);
  }, [selectedCategory, inventory]);

  useEffect(() => {
    searchItems(searchItem);
  }, [searchItem]);

  const handleOpen = () => {
    setOpen(true);
    setCameraOpen(false);
  };
  const handleClose = () => {
    setOpen(false);
    setCameraOpen(false);
  };

  const clearSearch = () => {
    setSearchItem("");
  };

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      justifyContent="center"
      alignItems="center"
      flexDirection="column"
      gap={2}
      sx={{ backgroundColor: "#f1f3f4", padding: 2 }}
    >
      <Typography variant="h4" sx={{ marginBottom: 2, color: "#202124" }}>
        Inventory Management
      </Typography>
      <FormControl
        variant="outlined"
        sx={{
          minWidth: 200,
          marginBottom: 2,
          "& .MuiOutlinedInput-root": {
            borderRadius: 1,
            backgroundColor: "white",
          },
        }}
      >
        <InputLabel>Filter by Category</InputLabel>
        <Select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          label="Filter by Category"
        >
          <MenuItem value="">
            <em>All</em>
          </MenuItem>
          {Array.from(new Set(inventory.map((item) => item.category))).map(
            (category) => (
              <MenuItem key={category} value={category}>
                {category}
              </MenuItem>
            )
          )}
        </Select>
      </FormControl>
      <Box
        width="80%"
        maxWidth={800}
        maxHeight="50vh"
        overflow="auto"
        sx={{
          borderRadius: 8,
          border: "1px solid #ddd",
          backgroundColor: "#fff",
          padding: 2,
        }}
      >
        <Box
          width="100%"
          bgcolor="#4285f4"
          display="flex"
          alignItems="center"
          justifyContent="center"
          sx={{ padding: "12px 0", borderRadius: "8px 8px 0 0" }}
        >
          <Typography variant="h5" color="white">
            Inventory
          </Typography>
        </Box>

        <Box
          display="flex"
          justifyContent="space-between"
          padding={1}
          sx={{ backgroundColor: "#f1f3f4", borderRadius: "8px 8px 0 0" }}
        >
          <Typography
            variant="body1"
            color="#202124"
            sx={{ width: "25%", textAlign: "center", fontWeight: "bold" }}
          >
            Name
          </Typography>
          <Typography
            variant="body1"
            color="#202124"
            sx={{ width: "25%", textAlign: "center", fontWeight: "bold" }}
          >
            Quantity
          </Typography>
          <Typography
            variant="body1"
            color="#202124"
            sx={{ width: "25%", textAlign: "center", fontWeight: "bold" }}
          >
            Category
          </Typography>
          <Typography
            variant="body1"
            color="#202124"
            sx={{ width: "25%", textAlign: "center", fontWeight: "bold" }}
          >
            Actions
          </Typography>
        </Box>

        <Stack width="100%" spacing={2} padding={2}>
          {filteredInventory.map(({ name, quantity, category }) => (
            <Box
              key={name}
              width="100%"
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              padding={1}
              sx={{
                borderRadius: 1,
                backgroundColor: "#f9f9f9",
                border: "1px solid #eee",
              }}
            >
              <Typography
                variant="body1"
                color="#202124"
                sx={{ width: "25%", textAlign: "center" }}
              >
                {name.charAt(0).toUpperCase() + name.slice(1)}
              </Typography>
              <Typography
                variant="body1"
                color="#202124"
                sx={{ width: "25%", textAlign: "center" }}
              >
                {quantity}
              </Typography>
              <Typography
                variant="body1"
                color="#202124"
                sx={{ width: "25%", textAlign: "center" }}
              >
                {category}
              </Typography>
              <Stack
                direction="row"
                spacing={1}
                sx={{ width: "25%", justifyContent: "center" }}
              >
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => {
                    addItem(name, category);
                  }}
                  sx={{ borderRadius: 1 }}
                >
                  Add
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  onClick={() => {
                    removeItem(name);
                  }}
                  sx={{ borderRadius: 1 }}
                >
                  Remove
                </Button>
              </Stack>
            </Box>
          ))}
        </Stack>
      </Box>
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        gap={2}
        width="80%"
        maxWidth={600}
        marginTop={2}
      >
        <TextField
          variant="outlined"
          fullWidth
          label="Search"
          value={searchItem}
          onChange={(e) => {
            setSearchItem(e.target.value);
          }}
          InputProps={{
            endAdornment: searchItem && (
              <InputAdornment position="end">
                <IconButton onClick={clearSearch}>
                  <Clear />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 1,
              backgroundColor: "white",
              boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
              borderColor: "#ddd",
            },
            "& .MuiInputLabel-root": {
              color: "#888",
            },
          }}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleOpen}
          sx={{ borderRadius: 1, padding: "10px 20px", marginTop: 2 }}
        >
          Add New Item
        </Button>
      </Box>
      <Modal open={open} onClose={handleClose}>
        <Box
          position="absolute"
          top="50%"
          left="50%"
          width={cameraOpen ? 800 : 300}
          height={cameraOpen ? 600 : 'auto'}
          bgcolor="white"
          boxShadow={24}
          p={3}
          display="flex"
          flexDirection="column"
          gap={2}
          sx={{
            transform: "translate(-50%, -50%)",
            borderRadius: 2,
            border: "1px solid #ddd",
              overflowY: cameraOpen ? 'scroll' : 'visible',
          }}
        >
          <Typography variant="h6" color="primary">
            Add Item
          </Typography>
          <Stack width="100%" spacing={2}>
            {cameraOpen ? (
              <>
                <FormControl fullWidth>
                  <InputLabel>Select Camera</InputLabel>
                  <Select
                    value={selectedDeviceId}
                    onChange={(e) => setSelectedDeviceId(e.target.value)}
                    label="Select Camera"
                  >
                    {devices.map((device) => (
                      <MenuItem key={device.deviceId} value={device.deviceId}>
                        {device.label || `Camera ${device.deviceId}`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <CameraComponent
                  setImage={setImage}
                  deviceId={selectedDeviceId}
                  handleProcessPhoto={handleProcessPhoto}
                />
                {/* <Button
                  variant="contained"
                  color="primary"

                  sx={{ borderRadius: 1 }}
                >
                  Process Photo
                </Button> */}
              </>
            ) : (
              <>
                <TextField
                  variant="outlined"
                  fullWidth
                  label="Item Name"
                  value={itemName}
                  onChange={(e) => {
                    setItemName(e.target.value);
                  }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1 } }}
                />
                <TextField
                  variant="outlined"
                  fullWidth
                  label="Category"
                  value={itemCategory}
                  onChange={(e) => {
                    setItemCategory(e.target.value);
                  }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1 } }}
                />
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => {
                    addItem(itemName, itemCategory, image);
                    setItemName("");
                    setItemCategory("");
                    handleClose();
                  }}
                  sx={{ borderRadius: 1 }}
                >
                  Add
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => setCameraOpen(true)}
                  sx={{ borderRadius: 1 }}
                >
                  Add with Camera
                </Button>
              </>
            )}
          </Stack>
        </Box>
      </Modal>
    </Box>
  );
}
