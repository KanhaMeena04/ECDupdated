import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Shared bottom sheet for Rider order reject / cancel reason selection.
Future<String?> showRiderReasonSheet(
  BuildContext context, {
  required String title,
  required String subtitle,
  required List<String> reasons,
  String confirmLabel = 'Confirm',
}) {
  String? selectedReason;
  final TextEditingController otherController = TextEditingController();
  String? errorText;

  return showModalBottomSheet<String>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.white,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
    ),
    builder: (modalCtx) => StatefulBuilder(
      builder: (ctx, setModalState) => Padding(
        padding: EdgeInsets.only(
          left: 20,
          right: 20,
          top: 20,
          bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
        ),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey[300],
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                title,
                style: GoogleFonts.poppins(fontSize: 17, fontWeight: FontWeight.bold, color: Colors.black87),
              ),
              const SizedBox(height: 4),
              Text(
                subtitle,
                style: GoogleFonts.poppins(fontSize: 12, color: Colors.grey[600]),
              ),
              const SizedBox(height: 12),
              ...reasons.map(
                (r) => RadioListTile<String>(
                  dense: true,
                  contentPadding: EdgeInsets.zero,
                  title: Text(r, style: GoogleFonts.poppins(fontSize: 13, color: Colors.black87)),
                  value: r,
                  groupValue: selectedReason,
                  activeColor: Colors.redAccent,
                  onChanged: (val) => setModalState(() {
                    selectedReason = val;
                    errorText = null;
                  }),
                ),
              ),
              if (selectedReason == 'Other Reason') ...[
                const SizedBox(height: 8),
                TextField(
                  controller: otherController,
                  maxLines: 2,
                  decoration: InputDecoration(
                    hintText: 'Please specify your reason...',
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  onChanged: (_) {
                    if (errorText != null) setModalState(() => errorText = null);
                  },
                ),
              ],
              if (errorText != null) ...[
                const SizedBox(height: 8),
                Text(errorText!, style: GoogleFonts.poppins(fontSize: 12, color: Colors.redAccent)),
              ],
              const SizedBox(height: 18),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.pop(ctx),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 13),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: Text('Dismiss', style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        final finalReason = selectedReason == 'Other Reason'
                            ? otherController.text.trim()
                            : (selectedReason ?? '').trim();
                        if (finalReason.isEmpty) {
                          setModalState(() => errorText = 'Reason is required');
                          return;
                        }
                        Navigator.pop(ctx, finalReason);
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.redAccent,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 13),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: Text(confirmLabel, style: GoogleFonts.poppins(fontWeight: FontWeight.bold)),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    ),
  );
}

