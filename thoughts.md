what if signed in user tries to sign in again?
cant the serviceProvider be a client of some other serviceProvider? what if the same email is signed as client and serviceProvider?
I also need to delete document of a user if did log in after a long time.
if user wants to change password lets give otp to phonenumber via email or message.


tips  try to implement payment feature for preService.

client cannot make request to same serviceProvider if the status is pending.
client and serviceProvider cannot be the same.
only client can populate the serviceRequests Model.
client can change the status to cancelled.

serviceProvider if left the requests unseen for 3-4 days then they are marked as Rejected.
serviceProvider should get request expiration warning if requests are about to be turned as rejected
serviceProvider can only alter the status either[ rejected,accepted] of a document.

serviceProvider and client can filter their services and request based on either [clientID for serviceProvider] , ProviderId for client] or by date.

API discovered 
    -forgot password api.












follow up 
    - use red:[rejected or cancelled] , yellow:[pending] , green:[accepted] in client's UI to indicate serviceRequests.
    - Service Provider can block the customer if he thinks he is not a legit one (Basically reporting him) then that customer wont see him at all
    - if too many reports on same customer than his email ID is block
    - users cannot clear history of their services from database.




    REMINDER : you have not implemented the message option in cancel and reject from client and provider.  just send message in the body.


    Password Reset
    client ----> server request to change or forget password
    client <---- server  email and cookie
    client ----> server  secret code 
    client <---- server  grant to update
    client ----> server  new password



    {
  asset_id: '9092a953bb23f1d17106d7cba56c6273',
  public_id: '1735668331028-ehmgkyz',
  version: 1735668333,
  version_id: '0e90e5f30369808f00e5286daae22e53',
  signature: 'e3b7dd1c65cd05f4288bc63d09ff9d428e1760aa',
  width: 200,
  height: 200,
  format: 'jpg',
  resource_type: 'image',
  created_at: '2024-12-31T18:05:33Z',
  tags: [],
  bytes: 6130,
  type: 'upload',
  etag: '77196a02a16fdbd84a1c448f0d9fa3e3',
  placeholder: false,
  url: 'http://res.cloudinary.com/dwostt43q/image/upload/v1735668333/1735668331028-ehmgkyz.jpg',
  secure_url: 'https://res.cloudinary.com/dwostt43q/image/upload/v1735668333/1735668331028-ehmgkyz.jpg',
  asset_folder: 'Profile-Pics',
  display_name: '1735668331028-ehmgkyz',
  original_filename: '1735668331028-ehmgkyz',
  original_extension: 'JPG',
  api_key: '519268685359442'
}


i want to update the profic pic of client so the previous public_id itself will be used.
in that case no db action is required.
challenges 
    must send the public_id of the current pic
    upload() middleware it must skip the new filename being generated
    folder name should remain intact.

I want to change/update shopImages single or multiple
   previous public_id itself will be used.In that case no db action is required.
  challenges 
      must send the public_ids of the current pics along with files 
      upload() middleware it must skip the new filename being generated
      folder name should remain intact.
      if in case of serviceRequest images need to be updated or deleted only allowed in pending state.

deleting the images
  send the public_ids od those image(s)
  no need to send any files here
  after deleting from cloudinary, DB should also change 
  if all images are deleted isUploaded must become false and default value should be assigned.


then implement rating