import 'package:flutter/material.dart';

class SquareWidget extends StatelessWidget {
  const SquareWidget({super.key, required this.imagePath});

  final String imagePath;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(5),
      decoration: BoxDecoration(
        border: Border.all(color: const Color.fromARGB(255, 0, 82, 150)),
        borderRadius: BorderRadius.circular(15),
        color: const Color.fromARGB(103, 116, 191, 252),
      ),
      child: Image.asset(imagePath, height: 60),
    );
  }
}
