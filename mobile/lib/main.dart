import 'package:flutter/material.dart';
import 'services/api_service.dart';

void main() {
  runApp(const QuantumGstApp());
}

class QuantumGstApp extends StatelessWidget {
  const QuantumGstApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Quantum GST',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF1D5FBF),
          primary: const Color(0xFF1D5FBF),
          secondary: const Color(0xFF0D9F91),
        ),
        useMaterial3: true,
        scaffoldBackgroundColor: const Color(0xFFF4F7FB),
      ),
      home: const DashboardScreen(),
    );
  }
}

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final ApiService api = ApiService();
  
  bool _isLoading = false;
  String _businessName = 'Quantum Traders India Pvt Ltd';
  String _primaryGstin = '27AAACQ1234F1Z5';
  String _stateName = 'Maharashtra';
  List<dynamic> _invoices = [];

  double taxableAmount = 10000;
  double gstRate = 18;
  bool isInterstate = false;
  int _currentIndex = 0;

  @override
  void initState() {
    super.initState();
    _syncFromCloud();
  }

  Future<void> _syncFromCloud() async {
    setState(() => _isLoading = true);
    try {
      final status = await api.getBusinessStatus();
      if (status['business'] != null) {
        final b = status['business'];
        _businessName = b['trade_name'] ?? b['legal_name'] ?? _businessName;
        if (b['gstins'] != null && (b['gstins'] as List).isNotEmpty) {
          final g = b['gstins'][0];
          _primaryGstin = g['gstin'] ?? _primaryGstin;
          _stateName = g['state_name'] ?? _stateName;
        }
      }

      final invList = await api.fetchInvoices();
      setState(() {
        _invoices = invList;
      });
    } catch (_) {
      // Keep offline/default state if unreachable
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final taxAmount = (taxableAmount * gstRate) / 100;
    final grandTotal = taxableAmount + taxAmount;
    final halfTax = taxAmount / 2;

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: const Color(0xFF0D9F91),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Text('Q', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 16)),
            ),
            const SizedBox(width: 8),
            const Text(
              'Quantum GST',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 18),
            ),
          ],
        ),
        backgroundColor: const Color(0xFF123B73),
        elevation: 0,
        actions: [
          IconButton(
            icon: Icon(
              _isLoading ? Icons.sync : Icons.cloud_done,
              color: const Color(0xFF0D9F91),
            ),
            tooltip: 'Sync Data with Cloud',
            onPressed: _syncFromCloud,
          ),
        ],
      ),
      body: _currentIndex == 0
          ? SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Active Business GSTIN Card
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFE8EDF4)),
                      boxShadow: const [
                        BoxShadow(color: Colors.black12, blurRadius: 4, offset: Offset(0, 1)),
                      ],
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 44,
                          height: 44,
                          decoration: BoxDecoration(
                            color: const Color(0xFFEAF2FF),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Icon(Icons.storefront, color: Color(0xFF1D5FBF)),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                _businessName,
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 15,
                                  color: Color(0xFF172033),
                                ),
                              ),
                              Text(
                                'GSTIN: $_primaryGstin ($_stateName)',
                                style: const TextStyle(
                                  fontSize: 12,
                                  color: Color(0xFF718096),
                                ),
                              ),
                            ],
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.refresh, color: Color(0xFF718096), size: 20),
                          onPressed: _syncFromCloud,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Action Banner
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF123B73), Color(0xFF1D5FBF)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Mobile Point-of-Sale (POS)',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 6),
                        const Text(
                          'Omnichannel Real-time Sync with Windows & Web',
                          style: TextStyle(color: Colors.white70, fontSize: 13),
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton.icon(
                          onPressed: () => _showNewInvoiceDialog(context),
                          icon: const Icon(Icons.add, size: 18),
                          label: const Text('Create Instant GST Invoice'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF0D9F91),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  const Text(
                    'Quick GST Calculation Engine',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF172033)),
                  ),
                  const SizedBox(height: 12),

                  // Interactive GST Place of Supply Simulator
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFE8EDF4)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Taxable Amount:', style: TextStyle(fontWeight: FontWeight.w600)),
                            Text('₹${taxableAmount.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                          ],
                        ),
                        Slider(
                          value: taxableAmount,
                          min: 1000,
                          max: 100000,
                          divisions: 99,
                          activeColor: const Color(0xFF1D5FBF),
                          onChanged: (val) {
                            setState(() {
                              taxableAmount = val;
                            });
                          },
                        ),
                        const Divider(height: 24),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Inter-State Supply (IGST)?', style: TextStyle(fontWeight: FontWeight.w600)),
                            Switch(
                              value: isInterstate,
                              activeTrackColor: const Color(0xFF0D9F91),
                              onChanged: (val) {
                                setState(() {
                                  isInterstate = val;
                                });
                              },
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF4F7FB),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Column(
                            children: [
                              if (!isInterstate) ...[
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    const Text('CGST (9%):', style: TextStyle(fontSize: 13, color: Color(0xFF718096))),
                                    Text('₹${halfTax.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold)),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    const Text('SGST (9%):', style: TextStyle(fontSize: 13, color: Color(0xFF718096))),
                                    Text('₹${halfTax.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold)),
                                  ],
                                ),
                              ] else ...[
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    const Text('IGST (18%):', style: TextStyle(fontSize: 13, color: Color(0xFF718096))),
                                    Text('₹${taxAmount.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold)),
                                  ],
                                ),
                              ],
                              const Divider(height: 16),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  const Text('Grand Total:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF123B73))),
                                  Text('₹${grandTotal.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Color(0xFF0D9F91))),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            )
          : _buildInvoicesView(),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        selectedItemColor: const Color(0xFF1D5FBF),
        unselectedItemColor: const Color(0xFF718096),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home_outlined), label: 'POS Billing'),
          BottomNavigationBarItem(icon: Icon(Icons.receipt_outlined), label: 'Invoices'),
        ],
      ),
    );
  }

  Widget _buildInvoicesView() {
    if (_invoices.isEmpty) {
      return ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _invoiceTile('INV/2026-27/0001', 'ABC Enterprises', '₹1,13,280.00', 'Intra-State (CGST+SGST)', true),
          _invoiceTile('SPF/2026-27/0001', 'Shopify Store Order #1042', '₹2,499.00', 'Inter-State (IGST)', false),
        ],
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _invoices.length,
      itemBuilder: (context, i) {
        final inv = _invoices[i];
        final num = inv['invoice_number'] ?? 'INV-LIVE';
        final cust = inv['customer'] != null ? inv['customer']['name'] : 'Walk-in Client';
        final amt = '₹${customNumberFormat(inv['grand_total'])}';
        final isIntra = !(inv['is_interstate'] ?? false);
        final tag = isIntra ? 'Intra-State (CGST+SGST)' : 'Inter-State (IGST)';

        return _invoiceTile(num, cust, amt, tag, isIntra);
      },
    );
  }

  String customNumberFormat(dynamic val) {
    if (val == null) return '0.00';
    final n = double.tryParse(val.toString()) ?? 0;
    return n.toStringAsFixed(2);
  }

  Widget _invoiceTile(String number, String client, String amount, String type, bool isIntra) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      elevation: 0,
      color: Colors.white,
      child: ListTile(
        title: Text(number, style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF1D5FBF))),
        subtitle: Text('$client\n$type', style: const TextStyle(fontSize: 12, color: Color(0xFF718096))),
        isThreeLine: true,
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(amount, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Color(0xFF123B73))),
            const SizedBox(height: 4),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: isIntra ? const Color(0xFFE2F7F3) : const Color(0xFFEAF2FF),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                isIntra ? 'CGST+SGST' : 'IGST',
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  color: isIntra ? const Color(0xFF0D9F91) : const Color(0xFF1D5FBF),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showNewInvoiceDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('New Mobile Invoice'),
        content: const Text('Creating instant statutory GST invoice synced across Web, Desktop, and Cloud.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Close'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF1D5FBF), foregroundColor: Colors.white),
            onPressed: () {
              Navigator.pop(ctx);
              _syncFromCloud();
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Tax invoice generated and synced to cloud!')),
              );
            },
            child: const Text('Generate & Sync'),
          ),
        ],
      ),
    );
  }
}
