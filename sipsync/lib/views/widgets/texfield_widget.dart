import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class TextFieldWidget extends StatelessWidget {
  const TextFieldWidget({super.key, required this.hintText, this.controller,this.isNumber = false, this.message = 'Campo obrigatório', required this.obscureText, required this.dis});

  final String hintText;
  final controller;
  final bool obscureText;
  final double dis;
  final bool isNumber;
  final String message;
  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        TextFormField(
          controller: controller,
          autocorrect: false,
          obscureText: obscureText,
          keyboardType: isNumber ? TextInputType.number : TextInputType.text,
          inputFormatters: isNumber
              ? [FilteringTextInputFormatter.digitsOnly]
              : [],
          decoration: InputDecoration(
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(20)),
            labelText: hintText,
          ),
          validator: (value){
            if(value == null || value.isEmpty){
              return message;
            }
            return null;
          },
        ),
        SizedBox(height: dis),
      ],
    );
  }
}
