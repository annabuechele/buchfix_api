type UserType = {
  id?: number;
  username: string;
  email: string;
  password?: string;
  salt?: string;
  is_admin?: 0 | 1;
  name: {
    firstName: string;
    lastName: string;
  };
  location: {
    street: string;
    number: string;
    zipCode: string;
    city: string;
    state: string;
    country: string;
  };
};
export default UserType;
