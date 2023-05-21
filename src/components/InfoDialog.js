import { Dialog, Transition } from "@headlessui/react";
import React, { Fragment } from "react";

const InfoDialog = ({ open, onClose }) => {
  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 z-10 overflow-y-auto"
        onClose={onClose}
      >
        <div className="min-h-screen px-4 text-center">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-black opacity-50 backdrop-blur-sm" />
          </Transition.Child>

          <span
            className="inline-block h-screen align-middle"
            aria-hidden="true"
          >
            &#8203;
          </span>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <div className="inline-block w-3/4 max-w-xl p-6 my-5 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              <Dialog.Title
                as="h3"
                className="text-lg font-medium leading-6 text-gray-900"
              >
                Information
              </Dialog.Title>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  This application connects with your Spotify account and helps
                  enhance your playlists. <br />
                  <br />
                  It does this by looking at various details of your songs, such
                  as how fast or slow they are, the musical key they're in, and
                  their genres. Using this information, the application groups
                  similar songs together and figures out the best sequence for
                  your playlist, aiming to make transitions between songs feel
                  as smooth as possible.
                  <br /> <br />
                  Once it's found the optimal order for your playlist, it
                  adjusts the order of your playlist directly in your Spotify
                  account. You don't have to do anything - just sit back and
                  enjoy your new and improved playlist!
                  <br /> <br />
                  To use this service, you'll need to give it permission to
                  interact with your Spotify account. This is all done securely
                  through Spotify's own systems - the app never sees your login
                  information. The result? A better organized playlist for your
                  enjoyment.
                  <br /> <br />
                </p>
                <a
                  href="https://github.com/manav-s/audify"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Click here to view the code on GitHub
                </a>
              </div>

              <div className="mt-4">
                <button
                  type="button"
                  className="inline-flex justify-center px-4 py-2 text-sm font-medium text-green-900 bg-green-100 border border-transparent rounded-md hover:bg-green-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-green-500"
                  onClick={onClose}
                >
                  Close
                </button>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
};

export default InfoDialog;
