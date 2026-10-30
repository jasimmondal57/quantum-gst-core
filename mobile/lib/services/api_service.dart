import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  static const String baseUrl = 'https://quantumgst.in/api/v1';

  String? _authToken = '1|enWHTeUypaa7Nk95K5EtQ0YqRnfaa9cjKCb2Ka3W2195dbea';

  void setAuthToken(String token) {
    _authToken = token;
  }

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        if (_authToken != null) 'Authorization': 'Bearer $_authToken',
      };

  /// Check onboarding and retrieve business profile
  Future<Map<String, dynamic>> getBusinessStatus() async {
    final response = await http.get(
      Uri.parse('$baseUrl/onboarding/status'),
      headers: _headers,
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to fetch business status');
    }
  }

  /// Authenticate user via Sanctum API
  Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/login'),
      headers: _headers,
      body: jsonEncode({
        'email': email,
        'password': password,
      }),
    );

    final data = jsonDecode(response.body);
    if (response.statusCode == 200) {
      _authToken = data['token'];
      return data;
    } else {
      throw Exception(data['message'] ?? 'Failed to authenticate');
    }
  }

  /// Fetch business statutory invoices from cloud
  Future<List<dynamic>> fetchInvoices({String? businessId}) async {
    final url = businessId != null
        ? '$baseUrl/invoices?business_id=$businessId'
        : '$baseUrl/invoices';

    final response = await http.get(
      Uri.parse(url),
      headers: _headers,
    );

    if (response.statusCode == 200) {
      final json = jsonDecode(response.body);
      return json['data'] ?? [];
    } else {
      throw Exception('Failed to load statutory invoices');
    }
  }

  /// Fetch customers list
  Future<List<dynamic>> fetchCustomers({String? businessId}) async {
    final url = businessId != null
        ? '$baseUrl/customers?business_id=$businessId'
        : '$baseUrl/customers';

    final response = await http.get(
      Uri.parse(url),
      headers: _headers,
    );

    if (response.statusCode == 200) {
      final json = jsonDecode(response.body);
      return json['data'] ?? [];
    } else {
      throw Exception('Failed to load customers');
    }
  }

  /// Create a statutory GST invoice on-the-go and sync to cloud
  Future<Map<String, dynamic>> createInvoice(Map<String, dynamic> invoiceData) async {
    final response = await http.post(
      Uri.parse('$baseUrl/invoices'),
      headers: _headers,
      body: jsonEncode(invoiceData),
    );

    final data = jsonDecode(response.body);
    if (response.statusCode == 201) {
      return data;
    } else {
      throw Exception(data['message'] ?? 'Invoice creation failed');
    }
  }
}
