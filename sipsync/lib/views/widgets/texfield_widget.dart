import 'package:flutter/material.dart';

class TextFieldWidget extends StatelessWidget {
  const TextFieldWidget({super.key, required this.hintText, this.controller, required this.obscureText, required this.dis});

  final String hintText;
  final controller;
  final bool obscureText;
  final double dis;
  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        TextField(
          controller: controller,
          autocorrect: false,
          obscureText: obscureText,
          decoration: InputDecoration(
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(20)),
            hintText: hintText,
          ),
        ),
        SizedBox(height: dis),
      ],
    );
  }
}
