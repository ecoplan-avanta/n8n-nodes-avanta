# n8n-nodes-avanta

![n8n.io - Workflow Automation](https://raw.githubusercontent.com/n8n-io/n8n/master/assets/n8n-logo.png)

An n8n community node for integrating with the Avanta ERP system. This node allows you to interact with Avanta's API to manage companies, orders, reports, and other business operations directly from your n8n workflows.

## Table of Contents

- [Installation](#installation)
- [Configuration](#configuration)
- [Operations](#operations)
- [Usage Examples](#usage-examples)
- [API Reference](#api-reference)
- [Contributing](#contributing)
- [License](#license)
- [Support](#support)

## Installation

### Community Nodes (Recommended)

1. Go to **Settings > Community Nodes** in your n8n instance
2. Select **Install a community node**
3. Enter `n8n-nodes-avanta` in the npm package name field
4. Click **Install**

### Manual Installation

If you're running n8n locally, you can install this node manually:

```bash
# Navigate to your n8n installation directory
cd ~/.n8n

# Install the node
npm install n8n-nodes-avanta

# Restart n8n
```

### Docker Installation

For Docker installations, you can install community nodes by:

1. Using the n8n interface (recommended)
2. Building a custom Docker image with the node pre-installed

## Configuration

### Credentials Setup

1. In n8n, go to **Credentials** and create new **Avanta API** credentials
2. Fill in the required fields:
   - **Host**: Your Avanta API base URL (e.g., `https://your-avanta-instance.com`)
   - **Access Token**: Your Avanta API access token

### Getting API Credentials

To obtain your Avanta API credentials:

1. Log into your Avanta system
2. Navigate to API settings or contact your system administrator
3. Generate an API access token
4. Note your API base URL

## Operations

The Avanta node supports the following resources and operations:

### Companies
- **Create**: Create new companies
- **Update**: Update existing companies
- **Delete**: Remove companies

### Company Addresses
- **Create**: Add addresses to companies
- **Update**: Modify company addresses

### Company Contacts
- **Create**: Add contacts to companies
- **Update**: Modify company contacts

### Company Users
- **Create**: Create company users
- **Link**: Link users to companies

### Reports
- **Backorders**: Create backorder reports
- **Credit Memos**: Generate credit memo reports
- **Invoices**: Create invoice reports
- **Orders**: Generate order reports
- **Reshipments**: Create reshipment reports
- **Shipments**: Generate shipment reports
- **Trackings**: Create tracking reports

### Products
- **Create**: Add new products
- **Update**: Modify existing products

### Sales Organizations
- **Create**: Set up sales organizations
- **Link**: Link companies to sales organizations

## Usage Examples

### Creating a Company

```json
{
  "name": "Example Corp",
  "email": "contact@example.com",
  "group_id": "1",
  "additionalFields": {
    "telephone": "+1-555-0123",
    "vat_id": "US123456789",
    "internet": "https://example.com"
  }
}
```

### Creating an Order Report

```json
{
  "customer_id": "CUST001",
  "company_id": 123,
  "customer_orderid": "ORD-2024-001",
  "order_positions": [
    {
      "item_pos": 1,
      "name": "Product A",
      "sku": "PROD-A-001",
      "qty": 5,
      "price": 29.99,
      "subtotal": 149.95
    }
  ]
}
```

### Creating a Company Address

```json
{
  "company_customer_id": "COMP001",
  "company_group_id": "1",
  "external_address_id": "ADDR001",
  "additionalFields": {
    "street": "123 Business Ave",
    "city": "Business City",
    "postcode": "12345",
    "country_id": "US",
    "address_type": 1
  }
}
```

## API Reference

### Authentication

All API requests require authentication using a Bearer token:

```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Base URL

All API endpoints are relative to your Avanta instance base URL:

```
https://your-avanta-instance.com/V1/proline-admin/
```

### Common Parameters

Most operations support these common parameters:

- **bulk**: Boolean - Whether to process multiple items in a single request
- **return**: Boolean - Whether to return response to a webhook
- **extension_attributes**: Array - Custom attributes for extending data

### Error Handling

The node includes comprehensive error handling:

- **Continue on Fail**: Option to continue workflow execution even if the node fails
- **Detailed Error Messages**: Clear error descriptions for troubleshooting
- **Retry Logic**: Built-in retry mechanisms for transient failures

## Data Types and Validation

### Required Fields

Each operation has specific required fields. Common required fields include:

- **Company Operations**: `name`, `group_id`
- **Report Operations**: `customer_id`, `company_id`
- **Address Operations**: `company_customer_id`, `company_group_id`

### Optional Fields

Most operations support additional optional fields through the "Additional Fields" collection, allowing for:

- Custom dates and timestamps
- Extension attributes
- Document file attachments
- Custom pricing and quantities

### Date Formatting

Date fields are automatically formatted to ISO 8601 format when sent to the API.

## Workflow Integration

### Triggers

This node works well with:

- **Webhook triggers** for real-time data processing
- **Schedule triggers** for batch operations
- **Manual triggers** for on-demand execution

### Data Flow

The node can be chained with:

- **HTTP Request nodes** for additional API calls
- **Set nodes** for data transformation
- **IF nodes** for conditional logic
- **Function nodes** for custom processing

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Verify your API credentials are correct
   - Check that your access token hasn't expired
   - Ensure your host URL is correct

2. **Validation Errors**
   - Check that all required fields are provided
   - Verify data types match expected formats
   - Review field length limitations

3. **Connection Issues**
   - Verify network connectivity to your Avanta instance
   - Check firewall settings
   - Confirm SSL/TLS configuration

### Debug Mode

Enable debug mode in n8n to see detailed request/response information:

1. Set environment variable: `N8N_LOG_LEVEL=debug`
2. Restart n8n
3. Check logs for detailed API communication

## Contributing

We welcome contributions to improve this node! Here's how you can help:

### Development Setup

1. Clone the repository:
```bash
git clone https://github.com/ecoplan-avanta/n8n-nodes-avanta.git
cd n8n-nodes-avanta
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

4. Run linting:
```bash
npm run lint
```

### Submitting Changes

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Run tests and linting: `npm run lint`
5. Commit your changes: `git commit -m "Add your feature"`
6. Push to your fork: `git push origin feature/your-feature-name`
7. Submit a pull request

### Code Standards

- Follow TypeScript best practices
- Use ESLint configuration provided
- Add appropriate type definitions
- Include JSDoc comments for public methods
- Follow n8n node development guidelines

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

### Documentation

- [n8n Documentation](https://docs.n8n.io/)
- [Avanta API Documentation](https://docs.avanta.com/api)
- [Node Development Guide](https://docs.n8n.io/integrations/creating-nodes/)

### Community

- [n8n Community Forum](https://community.n8n.io/)
- [GitHub Issues](https://github.com/ecoplan-avanta/n8n-nodes-avanta/issues)

### Commercial Support

For commercial support and custom development:

- **Email**: info@ecoplan.com
- **Website**: https://www.ecoplan.com

## Changelog

### Version 0.1.9
- Fixed ESLint compliance issues
- Improved error handling
- Added comprehensive field validation
- Enhanced documentation

### Version 0.1.8
- Added support for bulk operations
- Improved API response handling
- Fixed authentication issues

### Version 0.1.7
- Initial release
- Basic CRUD operations for companies
- Report generation functionality
- Address and contact management

---

**Note**: This is a community-maintained node. For issues specific to the Avanta API itself, please contact Avanta support directly.