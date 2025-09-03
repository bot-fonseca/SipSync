import 'package:flutter/material.dart';

class HeroWidget extends StatelessWidget {
  const HeroWidget({super.key, required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Hero(
          tag: 'hero1',
          child: SizedBox(
            width: 200,
            height: 70,
            child: Image.asset(
              'assets/images/logo.png',
               color: const Color.fromARGB(255, 3, 100, 150),
              // colorBlendMode: BlendMode.color, //color
            ),
          ),
        ),
        const SizedBox(height: 16),
        Text(
          title,
          textAlign: TextAlign.center,
          style: const TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 50, // a bit smaller
            color: Color.fromARGB(255, 3, 100, 150),
          ),
        ),
      ],
    );
  }
}
