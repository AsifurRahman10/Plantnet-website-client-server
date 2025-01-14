/* eslint-disable react/prop-types */
import {
  Dialog,
  Transition,
  TransitionChild,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { Fragment, useEffect, useState } from "react";
import useAuth from "../../hooks/useAuth";
import toast from "react-hot-toast";
import LoadingSpinner from "../Shared/LoadingSpinner";
import Button from "../Shared/Button/Button";
import useAxiosSecure from "../../hooks/useAxiosSecure";

const PurchaseModal = ({ closeModal, isOpen, plant, refetch }) => {
  const { user, loading } = useAuth();
  const { category, price, name, seller, quantity, _id } = plant;
  const axiosSecure = useAxiosSecure();
  const [totalQuantity, setTotalQuantity] = useState(1);
  const [totalPrice, setTotalPrice] = useState(plant.price);
  const [purchaseInfo, setPurchaseInfo] = useState({
    customer: {
      name: "",
      email: "",
      image: "",
    },
    plantID: plant._id,
    price: totalPrice,
    quantity: totalQuantity,
    seller: plant?.seller?.email,
    address: "",
    status: "Pending",
  });
  // Update purchaseInfo when user data is available
  useEffect(() => {
    if (user?.displayName && user?.email && user?.photoURL) {
      setPurchaseInfo((prev) => ({
        ...prev,
        customer: {
          name: user.displayName,
          email: user.email,
          image: user.photoURL,
        },
      }));
    }
  }, [user]); // Runs only when the `user` object changes
  // handle quantity operation
  const handleQuantity = (value) => {
    if (value > plant.quantity) {
      setTotalQuantity(quantity);
      return toast.error("Quantity exceeds available stock!");
    }
    if (value < 0) {
      // setTotalQuantity(1);
      return toast.error("Quantity cannot be less than 1");
    }
    console.log(value);
    setTotalQuantity(value);
    setTotalPrice(value * plant.price);
    setPurchaseInfo((prev) => {
      return { ...prev, quantity: value, price: value * plant.price };
    });
  };

  // handle purchase
  const handlePurchase = async () => {
    try {
      // fetch data
      await axiosSecure.post("/order", purchaseInfo);
      await axiosSecure.patch(`/plants/quantity/${_id}`, {
        quantityToUpdate: parseInt(totalQuantity),
        status: "decrease",
      });
      toast.success("Order Successful!");
      refetch();
    } catch (error) {
      // catch error
      console.log(error);
    } finally {
      closeModal();
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={closeModal}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <DialogTitle
                  as="h3"
                  className="text-lg font-medium text-center leading-6 text-gray-900"
                >
                  Review Info Before Purchase
                </DialogTitle>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">Plant: {plant.name}</p>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Category: {plant.category}
                  </p>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Customer: {user?.displayName}
                  </p>
                </div>

                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Price: $ {plant.price}
                  </p>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Available Quantity: {plant.quantity}
                  </p>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-gray-500 flex items-center gap-3">
                    Quantity:
                    <input
                      value={totalQuantity}
                      onChange={(e) => handleQuantity(parseInt(e.target.value))}
                      className="w-1/2 px-4 py-3 text-gray-800 border border-lime-300 focus:outline-lime-500 rounded-md bg-white"
                      name="quantity"
                      id="quantity"
                      type="number"
                      placeholder="Select quantity"
                      required
                    />
                  </p>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-gray-500 flex items-center gap-3">
                    Address:
                    <input
                      onChange={(e) =>
                        setPurchaseInfo((prev) => {
                          return { ...prev, address: e.target.value };
                        })
                      }
                      className="w-1/2 ml-1 px-4 py-3 text-gray-800 border border-lime-300 focus:outline-lime-500 rounded-md bg-white"
                      name="address"
                      id="address"
                      type="text"
                      placeholder="Enter address"
                      required
                    />
                  </p>
                </div>
                <div className="mt-3">
                  <Button
                    onClick={handlePurchase}
                    label={`Pay ${totalPrice}$`}
                  />
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default PurchaseModal;
