# Splitwise Clone Backend

A robust and scalable backend for a Splitwise-like application, built with the MERN stack (MongoDB, Express, Node.js). This API handles all core functionalities, including user authentication, group management, expense tracking, and intricate balance calculations with debt simplification.

## ✨ Features

* **User Authentication & Authorization**: Secure user registration, login, and protected routes using JWTs.
* **User Profile Management**: Retrieve authenticated user's profile details.
* **Group Management**:
    * Create, view, update, and delete expense groups.
    * Add and remove members from groups.
    * Assign a group admin.
* **Expense Tracking**:
    * Add expenses with detailed descriptions, amounts, and categories.
    * Specify who paid for an expense.
    * Flexible expense splitting: equal, exact amounts, or percentages.
    * Retrieve, update, and delete individual expenses.
    * View all expenses within a specific group.
* **Balance Calculation**: Dynamically calculate net balances for all members within a group.
* **Debt Simplification**: Algorithm to minimize the number of transactions required to settle debts within a group.
* **Payment & Settlement**: Record direct payments between users to settle outstanding debts.

---

## 🚀 Technologies Used

* **Node.js**: JavaScript runtime for server-side logic.
* **Express.js**: Fast, unopinionated, minimalist web framework for Node.js.
* **MongoDB**: NoSQL database for flexible data storage.
* **Mongoose**: MongoDB object data modeling (ODM) for Node.js.
* **bcryptjs**: Library for hashing passwords securely.
* **jsonwebtoken**: For implementing JSON Web Tokens (JWT) for authentication.
* **dotenv**: For managing environment variables.
* **Nodemon**: Development tool for automatic server restarts on file changes.

---

## 📂 Project Structure (Backend)


```
SplitBill/Backend/
├── config/                 # Database connection, environment variable validation
│   ├── db.js               # MongoDB connection setup
│   ├── env.js              # Environment variable loading and validation
│   └── index.js            # Centralized config aggregation
├── controllers/            # Business logic for handling requests
│   ├── authController.js   # User registration, login
│   ├── userController.js   # User profile actions
│   ├── groupController.js  # Group CRUD, member management
│   ├── expenseController.js# Expense CRUD
│   └── balanceController.js# Balance calculation, debt simplification, payments
├── middleware/             # Express middleware functions
│   ├── authMiddleware.js   # JWT authentication and protection
│   └── errorMiddleware.js  # Global error handling (can be expanded)
├── models/                 # Mongoose Schemas for data models
│   ├── User.js             # User schema
│   ├── Group.js            # Group schema
│   ├── Expense.js          # Expense schema
│   └── Payment.js          # Payment/Settlement schema
├── routes/                 # API endpoint definitions
│   ├── authRoutes.js       # Authentication routes (/api/auth)
│   ├── userRoutes.js       # User routes (/api/users)
│   ├── groupRoutes.js      # Group routes (/api/groups)
│   ├── expenseRoutes.js    # Expense routes (/api/expenses)
│   └── balanceRoutes.js    # Payment/Balance routes (/api/payments)
├── utils/                  # Helper utilities
│   ├── jwtUtils.js         # JWT token generation
│   ├── passwordUtils.js    # Password hashing/comparison (if moved from controller)
│   └── asyncHandler.js     # Async error handling wrapper
├── .env.example            # Example for environment variables (copy to .env)
├── .gitignore              # Files/folders to ignore in Git
├── package.json            # Project dependencies and scripts
└── server.js               # Main Express application entry point


```



---

## ⚙️ Setup and Installation

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd <your-repo-name>/server
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Create a `.env` file:**
    Create a file named `.env` in the `server/` directory.

    ```env
    PORT=5000
    MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/splitwise?retryWrites=true&w=majority
    JWT_SECRET=your_super_secret_jwt_key_here
    ```
    * Replace `<username>`, `<password>`, and `<cluster-url>` with your MongoDB Atlas credentials. If using local MongoDB, use `mongodb://localhost:27017/splitwise`.
    * Generate a strong, random string for `JWT_SECRET`.
    * **Important**: Add `.env` to your `.gitignore` file to prevent it from being committed to version control.

4.  **Run the server:**
    ```bash
    npm run dev
    ```
    The server will start on the port specified in your `.env` file (default: `5000`). You should see console output indicating MongoDB connection and server readiness.

---

## 💡 Database Schema

The backend uses the following MongoDB collections (managed by Mongoose schemas):

* **`User`**: Stores user credentials and profile information.
* **`Group`**: Represents expense groups, including members and admin.
* **`Expense`**: Records individual expenses within groups, specifying who paid and how it's split.
* **`Payment`**: Logs direct settlements between users.
* **`Activity`**: (Optional) For an activity feed to track events like expense additions or payments.

---

## 📋 API Endpoints

This is a comprehensive list of all exposed API endpoints. For detailed request/response examples and headers, refer to the [Frontend API Interaction Guide](#frontend-api-interaction-guide) table in this README.

### Authentication & User Profile
* `POST /api/auth/register` - Register a new user.
* `POST /api/auth/login` - Authenticate a user and get a JWT.
* `GET /api/users/me` - Get the authenticated user's profile.

### Group Management
* `POST /api/groups` - Create a new group.
* `GET /api/groups` - Get all groups the authenticated user is a part of.
* `GET /api/groups/:id` - Get details of a specific group.
* `PUT /api/groups/:id` - Update group details (Admin only).
* `DELETE /api/groups/:id` - Delete a group (Admin only).
* `PUT /api/groups/:id/members` - Add members to a group.
* `PUT /api/groups/:id/remove-members` - Remove members from a group (Admin only).

### Expense Management
* `POST /api/expenses` - Add a new expense within a group.
* `GET /api/expenses/:id` - Get details of a specific expense.
* `GET /api/groups/:groupId/expenses` - Get all expenses for a specific group.
* `PUT /api/expenses/:id` - Update an existing expense (Payer only).
* `DELETE /api/expenses/:id` - Delete an expense (Payer only).

### Balance & Settlements
* `GET /api/groups/:groupId/balances` - Get current balances for all members within a group.
* `GET /api/groups/:groupId/simplify-debts` - Get simplified debt suggestions for a group.
* `POST /api/payments` - Record a payment/settlement between two users.

---

## Frontend API Interaction Guide

This table details the interaction points for the frontend.

| Use Case / Action                 | Method | API Endpoint                          | Headers                                    | Body (JSON Example)                                                                                                                                                                                                                                                                                                                                                              | Expected Success Response (JSON Example)                                                                                                                                                                                                                                                                                         | Expected Error Response (JSON Example)                                |
| :-------------------------------- | :----- | :------------------------------------ | :----------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------ |
| **Authentication & User Profile** |        |                                       |                                            |                                                                                                                                                                                                                                                                                                                                                                                  |                                                                                                                                                                                                                                                                                                                        |                                                         |
| User Registration                 | `POST` | `/api/auth/register`         | `Content-Type: application/json`         | ```json { "username": "jane_doe", "email": "jane@example.com", "password": "securepassword123", "firstName": "Jane", "lastName": "Doe" } ```                                                                                                                                                                                                                               | ```json { "_id": "65123...", "username": "jane_doe", "email": "jane@example.com", "firstName": "Jane", "lastName": "Doe", "token": "eyJhbGciOiJIUzI1Ni..." } ``` (Status: 201 Created)                                                                                                                                     | ```json { "message": "User already exists" } ``` (Status: 400 Bad Request) |
| User Login                        | `POST` | `/api/auth/login`            | `Content-Type: application/json`         | ```json { "email": "jane@example.com", "password": "securepassword123" } ```                                                                                                                                                                                                                                                                                                  | ```json { "_id": "65123...", "username": "jane_doe", "email": "jane@example.com", "firstName": "Jane", "lastName": "Doe", "token": "eyJhbGciOiJIUzI1Ni..." } ``` (Status: 200 OK)                                                                                                                                           | ```json { "message": "Invalid credentials" } ``` (Status: 400 Bad Request) |
| Get My Profile                    | `GET`  | `/api/users/me`              | `Authorization: Bearer <JWT_TOKEN>`      | *None* | ```json { "_id": "65123...", "username": "jane_doe", "email": "jane@example.com", "firstName": "Jane", "lastName": "Doe", "defaultCurrency": "INR" } ``` (Status: 200 OK)                                                                                                                                   | ```json { "message": "Not authorized, no token" } ``` (Status: 401 Unauthorized) |
| **Group Management** |        |                                       |                                            |                                                                                                                                                                                                                                                                                                                                                                                  |                                                                                                                                                                                                                                                                                                                        |                                                         |
| Create Group                      | `POST` | `/api/groups`                | `Content-Type: application/json`, <br/>`Authorization: Bearer <JWT_TOKEN>` | ```json { "name": "Trip to Goa", "type": "Trip", "members": ["<USER_ID_1>", "<USER_ID_2>"] } ``` *(<USER_ID_1> should be the authenticated user's ID)* | ```json { "_id": "65432...", "name": "Trip to Goa", "type": "Trip", "members": ["<USER_ID_1>", "<USER_ID_2>"], "admin": "<USER_ID_1>", "simplifyDebts": true, "createdAt": "2025-07-19T...", "updatedAt": "2025-07-19T..." } ``` (Status: 201 Created)                                                                                                | ```json { "message": "Group must have at least one member." } ``` (Status: 400 Bad Request) |
| Get My Groups                     | `GET`  | `/api/groups`                | `Authorization: Bearer <JWT_TOKEN>`      | *None* | ```json [ { "_id": "65432...", "name": "Trip to Goa", "members": [{ "_id": "<USER_ID_1>", "username": "..." }, { "_id": "<USER_ID_2>", "username": "..." }], "admin": { "_id": "<USER_ID_1>", "username": "..." } }, { /* Another group */ } ] ``` (Status: 200 OK)                                                             | ```json { "message": "Server error" } ``` (Status: 500 Internal Server Error) |
| Get Group Details                 | `GET`  | `/api/groups/:groupId`       | `Authorization: Bearer <JWT_TOKEN>`      | *None* | ```json { "_id": "65432...", "name": "Trip to Goa", "members": [{ "_id": "<USER_ID_1>", "username": "..." }], "admin": { "_id": "<USER_ID_1>", "username": "..." }, "type": "Trip", "simplifyDebts": true } ``` (Status: 200 OK)                                                                                              | ```json { "message": "Group not found" } ``` (Status: 404 Not Found) |
| Update Group Details              | `PUT`  | `/api/groups/:groupId`       | `Content-Type: application/json`, <br/>`Authorization: Bearer <JWT_TOKEN>` | ```json { "name": "Goa Adventure" } ``` OR ```json { "type": "Other" } ```                                                                                                                                                                                                                                                                                           | ```json { "_id": "65432...", "name": "Goa Adventure", "type": "Trip", ... } ``` (Status: 200 OK)                                                                                                                                                         | ```json { "message": "Not authorized to update this group (Admin only)" } ``` (Status: 403 Forbidden) |
| Delete Group                      | `DELETE` | `/api/groups/:groupId`       | `Authorization: Bearer <JWT_TOKEN>`      | *None* | ```json { "message": "Group removed" } ``` (Status: 200 OK)                                                                                                                                                                                             | ```json { "message": "Not authorized to delete this group (Admin only)" } ``` (Status: 403 Forbidden) |
| Add Members to Group              | `PUT`  | `/api/groups/:groupId/members` | `Content-Type: application/json`, <br/>`Authorization: Bearer <JWT_TOKEN>` | ```json { "newMemberIds": ["<NEW_USER_ID_3>"] } ```                                                                                                                                                                                                                                                                                                             | ```json { "_id": "65432...", "name": "Trip to Goa", "members": ["<USER_ID_1>", "<USER_ID_2>", "<NEW_USER_ID_3>"], ... } ``` (Status: 200 OK)                                                                                                                  | ```json { "message": "One or more provided new member IDs are invalid users." } ``` (Status: 400 Bad Request) |
| Remove Members from Group         | `PUT`  | `/api/groups/:groupId/remove-members` | `Content-Type: application/json`, <br/>`Authorization: Bearer <JWT_TOKEN>` | ```json { "memberIdsToRemove": ["<USER_ID_2>"] } ```                                                                                                                                                                                                                                                                                                            | ```json { "_id": "65432...", "name": "Trip to Goa", "members": ["<USER_ID_1>"], ... } ``` (Status: 200 OK)                                                                                                                                                           | ```json { "message": "Cannot remove group admin directly via this route." } ``` (Status: 400 Bad Request) |
| **Expense Management** |        |                                       |                                            |                                                                                                                                                                                                                                                                                                                                                                                  |                                                                                                                                                                                                                                                                                                                        |                                                         |
| Add Expense                       | `POST` | `/api/expenses`              | `Content-Type: application/json`, <br/>`Authorization: Bearer <JWT_TOKEN>` | ```json { "groupId": "<GROUP_ID>", "description": "Dinner", "amount": 120, "paidBy": "<USER_ID_WHO_PAID>", "splitType": "equal", "shares": [ { "userId": "<MEMBER_ID_1>", "amount": 40 }, { "userId": "<MEMBER_ID_2>", "amount": 40 }, { "userId": "<MEMBER_ID_3>", "amount": 40 } ] } ``` | ```json { "_id": "65678...", "groupId": "<GROUP_ID>", "description": "Dinner", "amount": 120, "paidBy": "<USER_ID_WHO_PAID>", "splitType": "equal", "shares": [...], "createdAt": "2025-07-19T..." } ``` (Status: 201 Created)                                                               | ```json { "message": "Sum of shares does not match total expense amount." } ``` (Status: 400 Bad Request) |
| Get Group Expenses                | `GET`  | `/api/groups/:groupId/expenses` | `Authorization: Bearer <JWT_TOKEN>`      | *None* | ```json [ { "_id": "65678...", "description": "Dinner", "amount": 120, "paidBy": { "_id": "...", "username": "..." }, "shares": [{ "_id": "...", "userId": { "username": "..." }, "amount": 40 }]}, { /* Another expense */ } ] ``` (Status: 200 OK)                                           | ```json { "message": "Group not found." } ``` (Status: 404 Not Found) |
| Get Specific Expense              | `GET`  | `/api/expenses/:expenseId`   | `Authorization: Bearer <JWT_TOKEN>`      | *None* | ```json { "_id": "65678...", "description": "Dinner", "amount": 120, "paidBy": { "_id": "...", "username": "..." }, "shares": [{ "_id": "...", "userId": { "username": "..." }, "amount": 40 }]} ``` (Status: 200 OK)                                                                      | ```json { "message": "Expense not found." } ``` (Status: 404 Not Found) |
| Update Expense                    | `PUT`  | `/api/expenses/:expenseId`   | `Content-Type: application/json`, <br/>`Authorization: Bearer <JWT_TOKEN>` | ```json { "amount": 130, "shares": [ { "userId": "<MEMBER_ID_1>", "amount": 45 }, { "userId": "<MEMBER_ID_2>", "amount": 45 }, { "userId": "<MEMBER_ID_3>", "amount": 40 } ] } ``` *(Fields are optional, but shares must sum correctly if amount is provided/changed)* | ```json { "_id": "65678...", "amount": 130, "description": "Updated Dinner", ... } ``` (Status: 200 OK)                                                                                                                                                         | ```json { "message": "Not authorized to update this expense." } ``` (Status: 403 Forbidden) |
| Delete Expense                    | `DELETE` | `/api/expenses/:expenseId`   | `Authorization: Bearer <JWT_TOKEN>`      | *None* | ```json { "message": "Expense removed." } ``` (Status: 200 OK)                                                                                                                                                                                             | ```json { "message": "Not authorized to delete this expense." } ``` (Status: 403 Forbidden) |
| **Balance & Settlements** |        |                                       |                                            |                                                                                                                                                                                                                                                                                                                                                                                  |                                                                                                                                                                                                                                                                                                                        |                                                         |
| Get Group Balances                | `GET`  | `/api/groups/:groupId/balances` | `Authorization: Bearer <JWT_TOKEN>`      | *None* | ```json [ { "userId": "<USER_ID_1>", "balance": 56.67 }, { "userId": "<USER_ID_2>", "balance": -18.33 }, { "userId": "<USER_ID_3>", "balance": -38.33 } ] ``` (Status: 200 OK)                                                                                                                             | ```json { "message": "Group not found." } ``` (Status: 404 Not Found) |
| Get Simplified Debts              | `GET`  | `/api/groups/:groupId/simplify-debts` | `Authorization: Bearer <JWT_TOKEN>`      | *None* | ```json [ { "from": { "_id": "<USER_ID_2>", "username": "..." }, "to": { "_id": "<USER_ID_1>", "username": "..." }, "amount": 18.33 }, { "from": { "_id": "<USER_ID_3>", "username": "..." }, "to": { "_id": "<USER_ID_1>", "username": "..." }, "amount": 38.33 } ] ``` (Status: 200 OK)                             | ```json { "message": "Debt simplification is disabled for this group." } ``` (Status: 200 OK - with empty settlements) |
| Record Payment                    | `POST` | `/api/payments`              | `Content-Type: application/json`, <br/>`Authorization: Bearer <JWT_TOKEN>` | ```json { "payer": "<USER_ID_B>", "payee": "<USER_ID_A>", "amount": 18.33, "groupId": "<GROUP_ID>" } ``` *(`groupId` is optional for non-group specific payments)* | ```json { "_id": "65901...", "payer": "<USER_ID_B>", "payee": "<USER_ID_A>", "amount": 18.33, "groupId": "<GROUP_ID>", "createdAt": "2025-07-19T..." } ``` (Status: 201 Created)                                                                                                                                  | ```json { "message": "Payer and Payee cannot be the same user." } ``` (Status: 400 Bad Request) |

---

## 🤝 Contribution

Feel free to fork this repository and contribute to the project.

## 📄 License

This project is licensed under the MIT License.

---