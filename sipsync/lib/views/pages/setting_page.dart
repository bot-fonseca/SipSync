import 'package:flutter/material.dart';

class SettingPage extends StatefulWidget {
  const SettingPage({super.key});

  @override
  State<SettingPage> createState() => _SettingPageState();
}

class _SettingPageState extends State<SettingPage> {
  TextEditingController textController = TextEditingController();
  bool? isChecked = false;
  bool isSwitched = false;
  double sliderValue = 0.0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
        centerTitle: true,
        leading: BackButton(
          onPressed: () {
            Navigator.pop(context);
          },
        ),
        automaticallyImplyLeading: false,
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.only(top: 50.0, left: 20.0, right: 20.0),
          child: Column(
            children: [
              ElevatedButton(
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      duration: Duration(seconds: 4),
                      content: Text('SnackBar'),
                      behavior: SnackBarBehavior.floating,
                    ),
                  );
                },
                child: Text("Open SnackBar!"),
              ),
              Divider(color: Colors.blue, thickness: 2.0),
              ElevatedButton(
                onPressed: () {
                  showDialog(
                    context: context,
                    builder: (context) {
                      return AlertDialog(
                        title: Text('Dialog Title'),
                        content: Text('This is a dialog'),
                        actions: [
                          TextButton(
                            onPressed: () {
                              Navigator.of(context).pop();
                            },
                            child: Text('Close'),
                          ),
                        ],
                      );
                    },
                  );
                },
                child: Text("Open Dialog!"),
              ),
              TextField(
                controller: textController,
                decoration: InputDecoration(
                  border: OutlineInputBorder(),
                  hintText: 'Enter something',
                ),
                onEditingComplete: () => setState(() {}),
              ),
              Text(textController.text),
              Checkbox(
                value: isChecked,
                onChanged: (bool? value) {
                  setState(() {
                    isChecked = value;
                  });
                },
              ),
              CheckboxListTile(
                title: Text('Check me!'),
                value: isChecked,
                onChanged: (bool? value) {
                  setState(() {
                    isChecked = value;
                  });
                },
              ),
              Switch(
                value: isSwitched,
                onChanged: (bool value) {
                  setState(() {
                    isSwitched = value;
                  });
                },
              ),
              SwitchListTile(
                title: Text('Switch me!'),
                value: isSwitched,
                onChanged: (bool value) {
                  setState(() {
                    isSwitched = value;
                  });
                },
              ),
              Slider(
                min: 0.0,
                max: 10.0,
                divisions: 10,
                value: sliderValue,
                onChanged: (double value) {
                  setState(() {
                    sliderValue = value;
                  });
                  print(sliderValue);
                },
              ),
              GestureDetector(
                onTap: () {
                  print('Image tapped');
                },
                child: Image.asset(
                  'assets/images/sipsync-high-resolution-logo.png',
                ),
              ),
              ElevatedButton(onPressed: () {}, child: Text("Open SncakBar!")),
              ElevatedButton(onPressed: () {}, child: Text("Click Me!")),
              FilledButton(onPressed: () {}, child: Text("Click Me!")),
              TextButton(onPressed: () {}, child: Text("Click Me!")),
              OutlinedButton(onPressed: () {}, child: Text("Click Me!")),
              CloseButton(),
              BackButton(),
            ],
          ),
        ),
      ),
    );
  }
}
