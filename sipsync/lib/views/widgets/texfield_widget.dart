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
        TextFormField(
          controller: controller,
          autocorrect: false,
          obscureText: obscureText,
          decoration: InputDecoration(
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(20)),
            labelText: hintText,
          ),
          validator: (value){
            if(value == null || value.isEmpty){
              return 'Please enter some text';
            }
            return null;
          },
        ),
        SizedBox(height: dis),
      ],
    );
  }
}
