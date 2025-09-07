import 'package:flutter/material.dart';
import 'package:sipsync/views/widgets/container_widget.dart';
import 'package:sipsync/views/widgets/hero_widget.dart';

class StatisticsPage extends StatelessWidget {
  const StatisticsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.symmetric(horizontal: 20),
      child: SingleChildScrollView(
        child: Column(
          children: [
            SizedBox(height: 10),
            HeroWidget(title: 'Home'),
            
          ],
        ),
      ),
    );
  }
}
